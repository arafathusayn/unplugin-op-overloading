import type * as ts from 'typescript/lib/tsserverlibrary'

const DIRECTIVE = 'use operator overloading'

// TypeScript error codes for operator-related errors
const OPERATOR_ERROR_CODES = new Set([
  2365, // Operator 'X' cannot be applied to types...
  2362, // The left-hand side of an arithmetic operation must be...
  2363, // The right-hand side of an arithmetic operation must be...
  2460, // Type 'X' has no property 'Y' and no string index signature
])

interface PluginModule {
  typescript: typeof ts
}

function create(info: ts.server.PluginCreateInfo) {
  // Get plugin config
  const config = info.config || {}
  const debug = config.debug === true

  if (debug) {
    info.project.projectService.logger.info(
      '[operator-overloading] Language service plugin loaded',
    )
  }

  // Use the original language service as base
  const proxy = info.languageService

  /**
   * Check if a file contains the operator overloading directive
   */
  function hasDirective(fileName: string): boolean {
    const program = info.languageService.getProgram()
    const sourceFile = program?.getSourceFile(fileName)
    if (!sourceFile) return false

    const text = sourceFile.getFullText()
    const lines = text.split('\n').slice(0, 3)

    return lines.some(
      (line) =>
        line.includes(`"${DIRECTIVE}"`) || line.includes(`'${DIRECTIVE}'`),
    )
  }

  /**
   * Override getSemanticDiagnostics to filter operator errors
   */
  const originalGetSemanticDiagnostics =
    proxy.getSemanticDiagnostics.bind(proxy)
  proxy.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
    const prior = originalGetSemanticDiagnostics(fileName)

    // Check if file has the directive
    if (!hasDirective(fileName)) {
      return [...prior]
    }

    // Filter out operator-related errors
    const filtered = prior.filter((diagnostic: ts.Diagnostic): boolean => {
      const isOperatorError = OPERATOR_ERROR_CODES.has(diagnostic.code)
      if (isOperatorError && debug) {
        info.project.projectService.logger.info(
          `[operator-overloading] Suppressing error ${diagnostic.code} in ${fileName}`,
        )
      }
      return !isOperatorError
    })

    if (debug && filtered.length < prior.length) {
      info.project.projectService.logger.info(
        `[operator-overloading] Filtered ${prior.length - filtered.length} operator errors in ${fileName}`,
      )
    }

    return filtered
  }

  return proxy
}

function init(_modules: PluginModule) {
  return { create }
}

export = init
