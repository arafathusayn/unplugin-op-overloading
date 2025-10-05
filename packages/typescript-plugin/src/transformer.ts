import * as ts from 'typescript'

const DIRECTIVE = 'use operator overloading'

// TypeScript error codes for operator-related errors
const OPERATOR_ERROR_CODES = new Set([
  2365, // Operator 'X' cannot be applied to types...
  2362, // The left-hand side of an arithmetic operation must be...
  2363, // The right-hand side of an arithmetic operation must be...
  2460, // Type 'X' has no property 'Y' and no string index signature
])

/**
 * Check if a source file contains the operator overloading directive
 */
function hasDirective(sourceFile: ts.SourceFile): boolean {
  const text = sourceFile.getFullText()
  const lines = text.split('\n').slice(0, 3)
  return lines.some(
    (line) =>
      line.includes(`"${DIRECTIVE}"`) || line.includes(`'${DIRECTIVE}'`),
  )
}

/**
 * Operator to Symbol mapping
 * Maps binary operators to their Symbol.for() keys
 */
const OPERATOR_SYMBOLS: Record<string, string> = {
  '+': 'op.+',
  '-': 'op.-',
  '*': 'op.*',
  '/': 'op./',
  '%': 'op.%',
  '**': 'op.**',
  '==': 'op.==',
  '===': 'op.===',
  '!=': 'op.!=',
  '!==': 'op.!==',
  '<': 'op.<',
  '<=': 'op.<=',
  '>': 'op.>',
  '>=': 'op.>=',
  '<<': 'op.<<',
  '>>': 'op.>>',
  '>>>': 'op.>>>',
  '&': 'op.&',
  '|': 'op.|',
  '^': 'op.^',
}

/**
 * TypeScript transformer for operator overloading support
 *
 * This transformer provides two key features:
 * 1. Filters operator-related diagnostics for files with the directive
 * 2. Transforms binary operators into Symbol method calls for runtime execution
 *
 * @param program - TypeScript Program instance
 * @param _pluginConfig - ts-patch plugin configuration
 */
// eslint-disable-next-line import/no-default-export
export default function transformer(
  program: ts.Program,
  _pluginConfig: never,
  { ts: _tsInstance }: never,
) {
  // Wrap getSemanticDiagnostics to filter operator errors during type checking
  const originalGetSemanticDiagnostics =
    program.getSemanticDiagnostics.bind(program)
  program.getSemanticDiagnostics = (
    sourceFile?: ts.SourceFile,
    cancellationToken?: ts.CancellationToken,
  ) => {
    const diagnostics = originalGetSemanticDiagnostics(
      sourceFile,
      cancellationToken,
    )

    return diagnostics.filter((diagnostic) => {
      // Only filter operator-related errors
      if (!OPERATOR_ERROR_CODES.has(diagnostic.code)) {
        return true
      }

      // Check if the error is in a file with the directive
      if (diagnostic.file && hasDirective(diagnostic.file)) {
        return false
      }

      return true
    })
  }

  return (ctx: ts.TransformationContext) => {
    const { factory } = ctx

    return (sourceFile: ts.SourceFile) => {
      // Check if this file has the directive
      if (!hasDirective(sourceFile)) {
        return sourceFile
      }

      // Track if we're inside a Symbol method to skip transformation there
      let insideSymbolMethod = false

      // Visit and transform nodes
      function visit(node: ts.Node): ts.Node {
        // Check if we're entering a method with computed property name (Symbol.for)
        if (
          ts.isMethodDeclaration(node) &&
          ts.isComputedPropertyName(node.name)
        ) {
          const prevInsideSymbolMethod = insideSymbolMethod
          insideSymbolMethod = true
          const result = ts.visitEachChild(node, visit, ctx)
          insideSymbolMethod = prevInsideSymbolMethod
          return result
        }

        // Transform binary expressions into method calls (but not inside Symbol methods)
        if (ts.isBinaryExpression(node) && !insideSymbolMethod) {
          const operatorText = ts.tokenToString(node.operatorToken.kind)
          const symbolKey = OPERATOR_SYMBOLS[operatorText || '']

          if (symbolKey) {
            // Create: left[Symbol.for('op.+)](right)
            const symbolFor = factory.createPropertyAccessExpression(
              factory.createIdentifier('Symbol'),
              factory.createIdentifier('for'),
            )

            const symbolCall = factory.createCallExpression(
              symbolFor,
              undefined,
              [factory.createStringLiteral(symbolKey)],
            )

            const elementAccess = factory.createElementAccessExpression(
              ts.visitNode(node.left, visit) as ts.Expression,
              symbolCall,
            )

            const methodCall = factory.createCallExpression(
              elementAccess,
              undefined,
              [ts.visitNode(node.right, visit) as ts.Expression],
            )

            return methodCall
          }
        }

        return ts.visitEachChild(node, visit, ctx)
      }

      return ts.visitNode(sourceFile, visit) as ts.SourceFile
    }
  }
}
