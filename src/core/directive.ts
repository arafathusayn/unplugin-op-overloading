import { parseSync } from 'oxc-parser'

const FILE_ENABLE = 'use operator overloading'

/**
 * Check if code contains the operator overloading directive in the first 3 statements
 * @param code - Source code to check
 * @param filename - Optional filename (defaults to 'input.js' for basic JS parsing)
 */
export function hasDirective(
  code: string,
  filename: string = 'input.js',
): boolean {
  if (!code || code.trim().length === 0) {
    return false
  }

  try {
    // oxc-parser API: parseSync(filename, code)
    const result = parseSync(filename, code)

    if (!result.program || !result.program.body) {
      return false
    }

    const body = result.program.body
    const limit = Math.min(3, body.length)

    for (let i = 0; i < limit; i++) {
      const stmt = body[i]

      // Check for ExpressionStatement containing a Literal (directive)
      // oxc-parser uses ESTree format where string literals are type "Literal"
      if (
        stmt.type === 'ExpressionStatement' &&
        stmt.expression.type === 'Literal'
      ) {
        const value = stmt.expression.value
        if (typeof value === 'string' && value === FILE_ENABLE) {
          return true
        }
      }
    }

    return false
  } catch {
    // If parsing fails, return false
    return false
  }
}

/**
 * Find the directive position in the code
 * @param code - Source code to check
 * @param filename - Optional filename (defaults to 'input.js' for basic JS parsing)
 * @returns Object with start and end positions, or null if not found
 */
export function findDirective(
  code: string,
  filename: string = 'input.js',
): { start: number; end: number } | null {
  if (!code || code.trim().length === 0) {
    return null
  }

  try {
    // oxc-parser API: parseSync(filename, code)
    const result = parseSync(filename, code)

    if (!result.program || !result.program.body) {
      return null
    }

    const body = result.program.body
    const limit = Math.min(3, body.length)

    for (let i = 0; i < limit; i++) {
      const stmt = body[i]

      // Check for ExpressionStatement containing a Literal (directive)
      if (
        stmt.type === 'ExpressionStatement' &&
        stmt.expression.type === 'Literal'
      ) {
        const value = stmt.expression.value
        if (typeof value === 'string' && value === FILE_ENABLE) {
          return { start: stmt.start, end: stmt.end }
        }
      }
    }

    return null
  } catch {
    return null
  }
}
