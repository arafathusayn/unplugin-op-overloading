import MagicString from 'magic-string'
import { parseSync, Visitor } from 'oxc-parser'
import { findDirective, hasDirective } from './directive'
import type { OptionsResolved } from './options'

const GEN_DISABLE = 'operator-overloading disabled'

export interface TransformResult {
  code: string
  map: any
}

/**
 * Transform code to enable operator overloading
 */
export function transform(
  code: string,
  id: string,
  options: OptionsResolved,
): TransformResult | null {
  // Early directive gate: only transform files with the directive
  if (!hasDirective(code, id)) {
    return null
  }

  try {
    // Parse with oxc-parser (filename determines dialect)
    const result = parseSync(id, code)

    if (result.errors && result.errors.length > 0 && options.debug) {
      console.warn(
        `[unplugin-operator-overloading] Parse errors in ${id}:`,
        result.errors,
      )
    }

    const s = new MagicString(code)
    let hasChanges = false

    // Remove the directive from output (it's already been processed)
    const directivePos = findDirective(code, id)
    if (directivePos) {
      // Remove the entire directive statement including any trailing newline
      const endPos =
        code[directivePos.end] === '\n'
          ? directivePos.end + 1
          : directivePos.end
      s.remove(directivePos.start, endPos)
      hasChanges = true
    }

    // Track transformations with node metadata
    interface BinaryTransformation {
      type: 'binary'
      start: number
      end: number
      operator: string
      left: { start: number; end: number }
      right: { start: number; end: number }
      isEquality: boolean
    }

    interface UnaryTransformation {
      type: 'unary'
      start: number
      end: number
      operator: string
      argument: { start: number; end: number }
    }

    type Transformation = BinaryTransformation | UnaryTransformation

    const transformations: Transformation[] = []

    // Visit AST and collect transformations
    const visitor = new Visitor({
      BinaryExpression(node: any) {
        // Skip if inside generated IIFE (has sentinel directive)
        if (isInsideGeneratedCode(node)) return

        const operator = node.operator
        const { start, end } = node

        // Check if we should transform this operator
        if (shouldTransformBinaryOp(operator, options)) {
          // Check if this is an equality operator that needs normalization
          const isEquality = ['==', '!=', '===', '!=='].includes(operator)

          transformations.push({
            type: 'binary',
            start,
            end,
            operator,
            left: { start: node.left.start, end: node.left.end },
            right: { start: node.right.start, end: node.right.end },
            isEquality,
          })
          hasChanges = true
        }
      },

      UnaryExpression(node: any) {
        // Skip if inside generated code
        if (isInsideGeneratedCode(node)) return

        const operator = node.operator
        const { start, end } = node

        if (shouldTransformUnaryOp(operator)) {
          transformations.push({
            type: 'unary',
            start,
            end,
            operator,
            argument: { start: node.argument.start, end: node.argument.end },
          })
          hasChanges = true
        }
      },
    })

    // Walk the AST
    visitor.visit(result.program)

    // Apply transformations with dynamic code generation
    // Sort by start position (descending) to process innermost expressions first
    transformations.sort((a, b) => b.start - a.start)

    // Map to track generated code for each transformed range
    const generatedCode = new Map<string, string>()

    // Helper to get code for a range (from map or original source)
    const getCode = (start: number, end: number): string => {
      const key = `${start}-${end}`
      if (generatedCode.has(key)) {
        return generatedCode.get(key)!
      }
      return code.slice(start, end)
    }

    // Track applied ranges to detect overlaps
    const appliedRanges: Array<{ start: number; end: number }> = []

    for (const transformation of transformations) {
      const { start, end } = transformation

      // Check if any operands were transformed
      let operandWasTransformed = false
      if (transformation.type === 'binary') {
        const leftKey = `${transformation.left.start}-${transformation.left.end}`
        const rightKey = `${transformation.right.start}-${transformation.right.end}`
        operandWasTransformed =
          generatedCode.has(leftKey) || generatedCode.has(rightKey)
      } else if (transformation.type === 'unary') {
        const argKey = `${transformation.argument.start}-${transformation.argument.end}`
        operandWasTransformed = generatedCode.has(argKey)
      }

      // Check if this range overlaps with any already-applied range
      const overlaps = appliedRanges.some(
        (range) => end > range.start && start < range.end,
      )

      // Skip overlapping transformations UNLESS the overlap is because we transformed an operand
      // (in which case we WANT to transform the outer expression using the transformed operand)
      if (overlaps && !operandWasTransformed) {
        continue
      }

      let replacement: string

      if (transformation.type === 'binary') {
        // Extract operand code (may be transformed or original)
        const leftCode = getCode(
          transformation.left.start,
          transformation.left.end,
        )
        const rightCode = getCode(
          transformation.right.start,
          transformation.right.end,
        )

        // Generate replacement
        replacement = transformation.isEquality
          ? generateEqualityIIFE(
              transformation.operator,
              leftCode,
              rightCode,
              options,
            )
          : generateBinaryIIFE(
              transformation.operator,
              leftCode,
              rightCode,
              options,
            )
      } else {
        // Unary expression
        const argCode = getCode(
          transformation.argument.start,
          transformation.argument.end,
        )

        replacement = generateUnaryIIFE(
          transformation.operator,
          argCode,
          options,
        )
      }

      // Apply transformation
      // If an operand was transformed, we can't use overwrite because it would overlap
      // with already-edited chunks. Instead, use remove + appendLeft.
      if (operandWasTransformed && overlaps) {
        // For expressions with transformed operands, remove the range and insert the replacement
        s.remove(start, end)
        s.appendLeft(start, replacement)
      } else {
        // Normal case: no overlap or operand transformation
        s.overwrite(start, end, replacement)
      }

      // Store generated code for future reference
      generatedCode.set(`${start}-${end}`, replacement)

      // Mark this range as applied
      appliedRanges.push({ start, end })
    }

    if (!hasChanges) {
      return null
    }

    return {
      code: s.toString(),
      map: s.generateMap({
        hires: true,
        source: id,
        includeContent: true,
      }),
    }
  } catch (error) {
    if (options.debug) {
      console.error(
        `[unplugin-operator-overloading] Transform error in ${id}:`,
        error,
      )
    }
    return null
  }
}

/**
 * Check if we're inside generated code (has sentinel directive)
 */
function isInsideGeneratedCode(_node: any): boolean {
  // For now, we'll implement a simple check
  // In a full implementation, we'd track function scopes
  return false
}

/**
 * Check if binary operator should be transformed
 */
function shouldTransformBinaryOp(
  operator: string,
  options: OptionsResolved,
): boolean {
  // Arithmetic
  const arithmetic = ['+', '-', '*', '/', '%', '**']
  if (arithmetic.includes(operator)) return true

  // Bitwise
  const bitwise = ['&', '|', '^', '<<', '>>', '>>>']
  if (bitwise.includes(operator)) return true

  // Relational
  const relational = ['<', '<=', '>', '>=']
  if (relational.includes(operator)) return true

  // Special: 'in'
  if (operator === 'in') return true

  // Equality (option-gated)
  if (options.equality !== 'off') {
    if (
      options.equality === 'loose' &&
      (operator === '==' || operator === '!=')
    )
      return true
    if (
      options.equality === 'strict' &&
      (operator === '===' || operator === '!==')
    )
      return true
    if (
      options.equality === 'both' &&
      ['==', '!=', '===', '!=='].includes(operator)
    )
      return true
  }

  return false
}

/**
 * Check if unary operator should be transformed
 */
function shouldTransformUnaryOp(operator: string): boolean {
  return ['+', '-', '~', '!'].includes(operator)
}

/**
 * Generate symbol key with optional namespace
 */
function getSymbolKey(op: string, options: OptionsResolved): string {
  const namespace = options.symbolsNamespace
  if (namespace) {
    return `${namespace}/${op}`
  }
  return op
}

/**
 * Generate unary operator symbol key
 */
function getUnarySymbolKey(op: string, options: OptionsResolved): string {
  const mapping: Record<string, string> = {
    '+': 'plus',
    '-': 'minus',
    '~': '~',
    '!': '!',
  }
  const key = mapping[op] || op
  return getSymbolKey(key, options)
}

/**
 * Generate IIFE for binary operator
 */
function generateBinaryIIFE(
  operator: string,
  leftCode: string,
  rightCode: string,
  options: OptionsResolved,
): string {
  const symbolKey = getSymbolKey(operator, options)

  // Special case for 'in' operator (RHS dispatch)
  if (operator === 'in') {
    return `(() => {
  "${GEN_DISABLE}";
  const __key = ${leftCode};
  const __obj = ${rightCode};
  const __sym = Symbol.for("${symbolKey}");
  return __obj != null && __obj[__sym] !== undefined
    ? __obj[__sym](__key)
    : __key in __obj;
})()`
  }

  // General binary operator (LHS dispatch)
  return `(() => {
  "${GEN_DISABLE}";
  const __lhs = ${leftCode};
  const __rhs = ${rightCode};
  const __sym = Symbol.for("${symbolKey}");
  return __lhs != null && __lhs[__sym] !== undefined
    ? __lhs[__sym](__rhs)
    : (__lhs ${operator} __rhs);
})()`
}

/**
 * Generate IIFE for equality operators (with boolean normalization)
 */
function generateEqualityIIFE(
  operator: string,
  leftCode: string,
  rightCode: string,
  options: OptionsResolved,
): string {
  // Map != and !== to their base equality operators
  const baseOp =
    operator === '!=' ? '==' : operator === '!==' ? '===' : operator
  const isNegated = operator === '!=' || operator === '!=='
  const symbolKey = getSymbolKey(baseOp, options)

  const equalityCheck = `(() => {
  "${GEN_DISABLE}";
  const __lhs = ${leftCode};
  const __rhs = ${rightCode};
  const __sym = Symbol.for("${symbolKey}");
  const __res = __lhs != null && __lhs[__sym] !== undefined
    ? __lhs[__sym](__rhs)
    : __lhs ${baseOp} __rhs;
  return !!__res;
})()`

  // If it's a negated operator (!= or !==), wrap in negation
  return isNegated ? `!${equalityCheck}` : equalityCheck
}

/**
 * Generate IIFE for unary operator
 */
function generateUnaryIIFE(
  operator: string,
  argCode: string,
  options: OptionsResolved,
): string {
  const symbolKey = getUnarySymbolKey(operator, options)

  return `(() => {
  "${GEN_DISABLE}";
  const __arg = ${argCode};
  const __sym = Symbol.for("${symbolKey}");
  return __arg != null && __arg[__sym] !== undefined
    ? __arg[__sym]()
    : (${operator}__arg);
})()`
}
