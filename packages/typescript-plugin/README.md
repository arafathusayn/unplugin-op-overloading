# TypeScript Plugin - Operator Overloading

TypeScript Language Service Plugin that provides IDE support for operator overloading by suppressing operator-related type errors in files with the `"use operator overloading"` directive.

## Overview

This package is part of the `unplugin-op-overloading` ecosystem and provides **two TypeScript plugins** that work together:

1. **Language Service Plugin** (this package) - Provides IDE support (removes red squiggles)
2. **Transformer Plugin** (also in this package) - Transforms code during `tsc` compilation

### Which Plugin Do I Need?

**For projects using build tools (Vite/Webpack/Rollup/esbuild):**
- ✅ Use the **Language Service Plugin** for IDE support
- ✅ Use your **build tool plugin** for code transformation
- ⚠️ Transformer Plugin is optional

**For projects using `tsc` directly (libraries, standalone TypeScript):**
- ✅ Use **both plugins** for complete support
- The Language Service Plugin handles IDE experience
- The Transformer Plugin handles code transformation

## Installation

This plugin is included in `unplugin-op-overloading`:

```bash
bun install -D unplugin-op-overloading
```

## Setup

### Option 1: IDE Support Only (Recommended for Build Tool Projects)

**1. Configure TypeScript**

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "unplugin-op-overloading/typescript-plugin"
      }
    ]
  }
}
```

**2. Configure Your Editor**

**VS Code:**

Create or update `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

Then restart the TypeScript server:
- Press `Cmd/Ctrl + Shift + P`
- Select "TypeScript: Restart TS Server"

**WebStorm / IntelliJ IDEA:**

The plugin is automatically detected from `tsconfig.json`. No additional configuration needed.

**3. Use in Your Code**

```typescript
"use operator overloading"

class Vector {
  constructor(public x: number, public y: number) {}

  [Symbol.for('+')](other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  [Symbol.for('-')](other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y)
  }
}

const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)

// ✅ No TypeScript errors in the editor!
const sum = v1 + v2
const diff = v1 - v2
```

### Option 2: IDE Support + tsc Compilation (For Projects Using `tsc` Directly)

Add **both plugins** to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "unplugin-op-overloading/typescript-plugin"
      },
      {
        "transform": "unplugin-op-overloading/typescript-plugin/transformer",
        "transformProgram": true
      }
    ]
  }
}
```

**Then follow steps 2-3 from Option 1** for editor configuration and usage.

## Plugin Options

### Language Service Plugin Options

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "unplugin-op-overloading/typescript-plugin",
        "debug": true  // Enable debug logging (default: false)
      }
    ]
  }
}
```

### Transformer Plugin Options

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "unplugin-op-overloading/typescript-plugin/transformer",
        "transformProgram": true,
        "equality": "both",  // 'off' | 'loose' | 'strict' | 'both' (default: 'off')
        "debug": true        // Enable debug logging (default: false)
      }
    ]
  }
}
```

## Debug Mode

Enable debug logging to see which errors are being suppressed and transformation details:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "unplugin-op-overloading/typescript-plugin",
        "debug": true
      }
    ]
  }
}
```

**View debug logs:**
- **VS Code:** View → Output → TypeScript
- **WebStorm:** Help → Diagnostic Tools → Debug Log Settings → Add `#com.intellij.lang.typescript`

## How It Works

### Language Service Plugin

1. Intercepts TypeScript's semantic diagnostics
2. Detects files with `"use operator overloading"` directive
3. Filters out operator-related errors:
   - `TS2365` - Operator cannot be applied to types
   - `TS2362` - Left-hand side of arithmetic operation must be of type 'any', 'number', etc.
   - `TS2363` - Right-hand side of arithmetic operation must be of type 'any', 'number', etc.
   - `TS2460` - Type has no call signatures

### Transformer Plugin

1. Parses TypeScript source files
2. Detects `"use operator overloading"` directive
3. Transforms operator expressions into method calls
4. Generates source maps for debugging

**Example transformation:**

```typescript
// Input
"use operator overloading"
const sum = a + b

// Output
const sum = (() => {
  "operator-overloading disabled"
  const __lhs = a
  const __rhs = b
  const __sym = Symbol.for('+')
  return __lhs != null && __lhs[__sym] !== undefined
    ? __lhs[__sym](__rhs)
    : __lhs + __rhs
})()
```

## Important Notes

### Language Service Plugin (IDE Support)

- ✅ **Removes red squiggles** in VS Code, WebStorm, and TypeScript-aware IDEs
- ✅ **Works automatically** with files containing `"use operator overloading"`
- ✅ **No `@ts-expect-error` needed** in your source code
- ⚠️ **IDE-only:** Does NOT affect `tsc` command-line compilation
- ⚠️ **Requires build tool** for actual transformation (Vite/Webpack/Rollup) or Transformer Plugin

### Transformer Plugin (Compile-time Transformation)

- ✅ **Transforms code** when using `tsc` directly
- ✅ **Alternative to build tool plugins** for TypeScript-only projects
- ✅ **Useful for libraries** that don't use bundlers
- ⚠️ **Requires `ts-patch`** or similar tool to enable TypeScript program transformers
- ⚠️ **Not needed** if using build tools (Vite/Webpack/Rollup)

### Recommendations

✅ **Recommended Setup (Most Projects):**
```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "unplugin-op-overloading/typescript-plugin" }
    ]
  }
}
```
- Use Language Service Plugin for IDE support
- Use build tool plugin (Vite/Webpack/Rollup) for transformation
- This provides the best development experience

✅ **For `tsc`-only Projects:**
- Use both Language Service Plugin and Transformer Plugin
- Requires additional tooling like `ts-patch`
- See [TypeScript Plugin Guide](../../docs/typescript-plugin-guide.md) for details

## Supported Operators

The plugin suppresses errors for all operator overloading patterns:

### Arithmetic Operators
```typescript
[Symbol.for('+')](other)   // a + b
[Symbol.for('-')](other)   // a - b
[Symbol.for('*')](other)   // a * b
[Symbol.for('/')](other)   // a / b
[Symbol.for('%')](other)   // a % b
[Symbol.for('**')](other)  // a ** b
```

### Comparison Operators
```typescript
[Symbol.for('<')](other)   // a < b
[Symbol.for('>')](other)   // a > b
[Symbol.for('<=')](other)  // a <= b
[Symbol.for('>=')](other)  // a >= b
```

### Equality Operators
```typescript
[Symbol.for('==')](other)  // a == b
[Symbol.for('!=')](other)  // a != b
[Symbol.for('===')](other) // a === b
[Symbol.for('!==')](other) // a !== b
```

### Unary Operators
```typescript
[Symbol.for('minus')]()    // -a
[Symbol.for('plus')]()     // +a
```

## Troubleshooting

### Red squiggles still appear in VS Code

1. Verify TypeScript uses workspace version:
   - Open any `.ts` file
   - Check bottom-right status bar
   - Should show "TypeScript X.X.X" (workspace version)
   - If not, click it and select "Use Workspace Version"

2. Restart TypeScript server:
   - `Cmd/Ctrl + Shift + P`
   - "TypeScript: Restart TS Server"

3. Check plugin is loaded:
   - Enable debug mode
   - View → Output → TypeScript
   - Look for plugin initialization messages

### Errors still appear when running `tsc`

This is expected behavior. The Language Service Plugin **only affects IDE experience**.

**Solutions:**
- **Recommended:** Use a build tool (Vite/Webpack/Rollup) instead of `tsc`
- **Alternative:** Add the Transformer Plugin (requires `ts-patch`)
- **Workaround:** Use `@ts-expect-error` comments before operator lines

## Examples

### Complete Vector Class

```typescript
"use operator overloading"

export class Vector {
  constructor(
    public x: number,
    public y: number
  ) {}

  [Symbol.for('+')](other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  [Symbol.for('-')](other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y)
  }

  [Symbol.for('*')](scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar)
  }

  [Symbol.for('minus')](): Vector {
    return new Vector(-this.x, -this.y)
  }

  magnitude(): number {
    return Math.hypot(this.x, this.y)
  }

  [Symbol.for('<')](other: Vector): boolean {
    return this.magnitude() < other.magnitude()
  }

  toString(): string {
    return `Vector(${this.x}, ${this.y})`
  }
}

// ✅ All operators work without TypeScript errors!
const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)

const sum = v1 + v2        // Vector(4, 6)
const diff = v1 - v2       // Vector(2, 2)
const scaled = v1 * 2      // Vector(6, 8)
const negated = -v1        // Vector(-3, -4)
const isSmaller = v2 < v1  // true
```

## Related Documentation

- [Main Documentation](../../README.md) - Complete operator overloading guide
- [TypeScript Plugin Guide](../../docs/typescript-plugin-guide.md) - In-depth plugin documentation
- [Example Project](../../examples/vite-typescript/) - Working Vite + TypeScript example

## License

Apache-2.0
