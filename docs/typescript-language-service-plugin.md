# TypeScript Language Service Plugin for Operator Overloading

## Overview

A TypeScript Language Service Plugin that suppresses operator errors in files containing the `"use operator overloading"` directive.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  IDE (VS Code, WebStorm, etc)                   │
│  ↓                                               │
│  TypeScript Language Service                    │
│  ↓                                               │
│  Custom Plugin (intercepts semantic diagnostics)│
│  ↓                                               │
│  Filters out operator errors if directive exists│
└─────────────────────────────────────────────────┘
```

## Implementation

### 1. Create Plugin Package

```typescript
// typescript-plugin-operator-overloading/src/index.ts
import type * as ts from 'typescript/lib/tsserverlibrary'

function init(modules: { typescript: typeof ts }) {
  const ts = modules.typescript

  function create(info: ts.server.PluginCreateInfo) {
    const proxy: ts.LanguageService = Object.create(null)

    // Proxy all language service methods
    for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
      const x = info.languageService[k]!
      // @ts-expect-error
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args)
    }

    // Override getSemanticDiagnostics to filter operator errors
    proxy.getSemanticDiagnostics = (fileName: string) => {
      const prior = info.languageService.getSemanticDiagnostics(fileName)

      // Check if file has the directive
      const sourceFile = info.languageService.getProgram()?.getSourceFile(fileName)
      if (!sourceFile) return prior

      const fileText = sourceFile.getFullText()
      if (!hasDirective(fileText)) return prior

      // Filter out operator-related errors
      return prior.filter(diagnostic => {
        // TS2365: Operator '+' cannot be applied to types...
        // TS2362: The left-hand side of an arithmetic operation...
        // TS2363: The right-hand side of an arithmetic operation...
        const operatorErrorCodes = [2365, 2362, 2363]
        return !operatorErrorCodes.includes(diagnostic.code)
      })
    }

    return proxy
  }

  function hasDirective(text: string): boolean {
    const lines = text.split('\n').slice(0, 3)
    return lines.some(line =>
      line.includes('"use operator overloading"') ||
      line.includes("'use operator overloading'")
    )
  }

  return { create }
}

export = init
```

### 2. Package Configuration

```json
// typescript-plugin-operator-overloading/package.json
{
  "name": "typescript-plugin-operator-overloading",
  "version": "0.1.0",
  "main": "dist/index.js",
  "keywords": ["typescript", "plugin", "operator-overloading"],
  "peerDependencies": {
    "typescript": ">=4.5.0"
  }
}
```

### 3. User Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-plugin-operator-overloading"
      }
    ]
  }
}
```

### 4. IDE Setup

**VS Code:**
```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Pros & Cons

### Pros
- ✅ Clean code without `@ts-expect-error` comments
- ✅ Better developer experience in IDEs
- ✅ Auto-applies to all operator usage

### Cons
- ❌ Only works in editors, NOT in CLI `tsc` commands
- ❌ Requires users to install and configure plugin
- ❌ Complex to maintain
- ❌ Different behavior between IDE and build

## Recommendation

**Use for:** Projects where developer experience is critical and build uses unplugin (not tsc)

**Don't use if:** You need `tsc` to pass without errors (CI/CD using tsc)
