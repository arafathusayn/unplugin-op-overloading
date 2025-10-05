# Operator Overloading - Vite + TypeScript Example

This example demonstrates `unplugin-op-overloading` in a real-world Vite + TypeScript application with interactive demos.

## Features Demonstrated

### 🎯 Vector Operations
- Addition: `v1 + v2`
- Subtraction: `v1 - v2`
- Scalar multiplication: `v * 2`
- Unary negation: `-v`
- Magnitude comparison: `v1 < v2`
- Chained operations: `v1 + v2 * 2`

### 🔢 Complex Number Arithmetic
- Addition: `c1 + c2`
- Multiplication: `c1 * c2`

### 🔲 Matrix Multiplication (2×2)
- True mathematical row × column multiplication
- Natural syntax: `A * B`
- Example:
  ```
  [1 2] * [5 6] = [19 22]
  [3 4]   [7 8]   [43 50]
  ```

### 🛠️ Development Tools
- ✅ TypeScript Language Service Plugin (IDE error suppression)
- ✅ Vite build with zero warnings
- ✅ TypeScript strict mode enabled
- ✅ Bun workspace integration

## Quick Start

```bash
# From project root
bun install

# Development server with hot reload
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

Open http://localhost:5173 and click the demo buttons to see operator overloading in action!

## Project Structure

```
examples/vite-typescript/
├── src/
│   ├── main.ts           # Frontend with interactive demos
│   ├── vector-demo.ts    # Vector and Complex number classes
│   ├── simple.js         # Matrix multiplication example
│   └── style.css         # Styling
├── vite.config.ts        # Vite configuration with unplugin
├── tsconfig.json         # TypeScript + Language Service Plugin
└── .vscode/              # VS Code workspace settings
```

## How to Use Operator Overloading

### 1. Add the Directive

Files using operator overloading **must** include the directive at the top:

```javascript
'use operator overloading'
```

### 2. Define Operator Methods

Use `Symbol.for('operator')` to define operator behavior:

```javascript
class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  [Symbol.for('+')](other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }
}
```

### 3. Use Natural Syntax

Write operators naturally in your code:

```javascript
const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)
const sum = v1 + v2  // Calls v1[Symbol.for('+')](v2)
```

## Supported Operators

| Operator | Symbol Key | Example |
|----------|-----------|---------|
| `+` | `'+'` | `a + b` |
| `-` | `'-'` | `a - b` |
| `*` | `'*'` | `a * b` |
| `/` | `'/'` | `a / b` |
| `%` | `'%'` | `a % b` |
| `**` | `'**'` | `a ** b` |
| `==` | `'=='` | `a == b` |
| `!=` | `'!='` | `a != b` |
| `===` | `'==='` | `a === b` |
| `!==` | `'!=='` | `a !== b` |
| `<` | `'<'` | `a < b` |
| `>` | `'>'` | `a > b` |
| `<=` | `'<='` | `a <= b` |
| `>=` | `'>='` | `a >= b` |
| unary `-` | `'minus'` | `-a` |
| unary `+` | `'plus'` | `+a` |

## TypeScript Plugin Configuration

This example includes **two TypeScript plugins** working together for the best development experience:

### 1. Language Service Plugin (IDE Support)

**What it does:**
- ✅ Suppresses TypeScript errors for operator overloading in your editor
- ✅ Works automatically with files containing `"use operator overloading"`
- ✅ No `@ts-expect-error` comments needed in the IDE
- ✅ Provides a clean development experience in VS Code, WebStorm, and other TypeScript-aware editors

### 2. TypeScript Transformer Plugin

**What it does:**
- ✅ Transforms operator overloading syntax during TypeScript compilation
- ✅ Enables compile-time transformation when using `tsc` directly
- ✅ Provides an alternative to build-time transformation via Vite/Webpack plugins
- ✅ Useful for projects that rely on TypeScript's native compilation

### Complete Setup

**Already configured in this example!** See:
- `tsconfig.json` - Both plugin configurations
- `.vscode/settings.json` - VS Code workspace settings

**To use in your own project, add BOTH plugins to `tsconfig.json`:**

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

**VS Code users:** Restart the TypeScript server after setup:
1. Press `Cmd/Ctrl + Shift + P`
2. Type: "TypeScript: Restart TS Server"

### Which Plugin to Use?

**For most projects using build tools (Vite/Webpack/Rollup):**
- Use the **Language Service Plugin** (first entry) for IDE support
- Use the **Vite/Webpack plugin** (configured in `vite.config.ts`) for actual transformation
- The transformer plugin is optional in this case

**For projects using `tsc` directly:**
- Use **both plugins** as shown above
- The Language Service Plugin provides IDE support
- The Transformer Plugin handles actual code transformation during compilation

### Important Notes

⚠️ **Language Service Plugin Limitation:** The Language Service Plugin ONLY affects your IDE experience. Running `tsc` directly will still show errors unless you also use the Transformer Plugin.

✅ **Recommended Setup:** This example uses both TypeScript plugins + the Vite plugin for maximum compatibility and the best developer experience across all scenarios.

## Configuration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import OperatorOverloading from 'unplugin-op-overloading/vite'

export default defineConfig({
  plugins: [
    OperatorOverloading({
      equality: 'both', // Transform ==, !=, ===, !==
      debug: false,     // Enable debug logging
    }),
  ],
})
```

### Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `equality` | `'off' \| 'loose' \| 'strict' \| 'both'` | `'off'` | Equality operator transformation mode |
| `debug` | `boolean` | `false` | Enable debug logging |
| `include` | `FilterPattern` | `[/\.[cm]?[jt]sx?$/]` | Files to include |
| `exclude` | `FilterPattern` | `[/node_modules/]` | Files to exclude |

## Examples in This Project

### Vector Demo (`vector-demo.ts`)

```typescript
'use operator overloading'

export class Vector {
  constructor(public x: number, public y: number) {}

  [Symbol.for('+')](other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  [Symbol.for('-')](other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y)
  }

  [Symbol.for('*')](scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar)
  }
}

// Usage
const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)
const sum = v1 + v2           // Vector(4, 6)
const scaled = v1 * 2         // Vector(6, 8)
const chained = v1 + v2 * 2   // Vector(5, 8)
```

### Matrix Multiplication (`simple.js`)

```javascript
'use operator overloading'

export function Matrix(rows) {
  return {
    rows, // [[a, b], [c, d]]

    [Symbol.for('*')](other) {
      // Mathematical row × column multiplication
      const result = [
        [
          this.rows[0][0] * other.rows[0][0] + this.rows[0][1] * other.rows[1][0],
          this.rows[0][0] * other.rows[0][1] + this.rows[0][1] * other.rows[1][1],
        ],
        [
          this.rows[1][0] * other.rows[0][0] + this.rows[1][1] * other.rows[1][0],
          this.rows[1][0] * other.rows[0][1] + this.rows[1][1] * other.rows[1][1],
        ],
      ]
      return Matrix(result)
    },
  }
}

export function multiply(a, b) {
  return a * b // Uses operator overloading
}

// Usage
const A = Matrix([[1, 2], [3, 4]])
const B = Matrix([[5, 6], [7, 8]])
const C = multiply(A, B)
// Result: Matrix([[19, 22], [43, 50]])
```

## How the Transformation Works

### Input Code

```javascript
'use operator overloading'

const sum = a + b
```

### Transformed Output

```javascript
const sum = (() => {
  "operator-overloading disabled";
  const __lhs = a;
  const __rhs = b;
  const __sym = Symbol.for("+");
  return __lhs != null && __lhs[__sym] !== undefined
    ? __lhs[__sym](__rhs)
    : (__lhs + __rhs);
})();
```

### Key Points

1. **IIFE (Immediately Invoked Function Expression)** - Wraps each operator to isolate variables
2. **Fallback behavior** - If no operator method exists, uses native JavaScript behavior
3. **Null safety** - Checks for null/undefined before calling operator method
4. **Directive removal** - The `"use operator overloading"` directive is removed from output

## Build Output

Production builds are optimized:
- ✅ Zero warnings
- ✅ Minified and tree-shaken
- ✅ Source maps included
- ✅ Operators transformed correctly

```bash
$ bun run build

vite v7.1.9 building for production...
✓ 6 modules transformed.
dist/index.html                 0.46 kB │ gzip: 0.29 kB
dist/assets/index-CdsmOBE1.js   8.13 kB │ gzip: 1.81 kB
✓ built in 52ms
```

## Learn More

- [Main Documentation](../../README.md)
- [TypeScript Plugin Guide](../../docs/typescript-plugin-guide.md)
- [Design Document](../../docs/design.md)
- [API Reference](../../src/core/README.md)

## Troubleshooting

### TypeScript Errors in IDE

**Problem:** Still seeing red squiggles in VS Code
**Solution:**
1. Ensure `typescript-plugin` is listed in `tsconfig.json`
2. Restart TS Server: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
3. Check workspace TypeScript is being used (bottom-right of VS Code)

### Build Warnings

**Problem:** "Module level directives cause errors when bundled"
**Solution:** The directive is automatically removed during transformation. If you see this warning, the plugin may not be configured correctly.

### Operators Not Working at Runtime

**Problem:** `Cannot read property 'Symbol(+)' of undefined`
**Solution:**
1. Ensure the file has `'use operator overloading'` directive
2. Check the operator method is defined: `[Symbol.for('+')](other) { ... }`
3. Verify the plugin is configured in `vite.config.ts`

## License

This example is part of the `unplugin-op-overloading` project.
