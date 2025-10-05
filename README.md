# unplugin-op-overloading

Operator overloading for JavaScript and TypeScript using a build-time transformation.

## Features

✨ **Natural Syntax** - Write `a + b` instead of `a[Symbol.for('+')](b)`
🔧 **Build-time Transformation** - Zero runtime overhead, pure JavaScript output
📦 **Universal** - Works with Vite, Webpack, Rollup, esbuild, Rspack, and Rolldown
🎯 **Opt-in** - Uses `"use operator overloading"` directive for explicit control
🛡️ **Type-safe** - Includes TypeScript Language Service Plugin for IDE support
⚡ **Fast** - Uses oxc-parser for blazing-fast AST parsing

## Installation

```bash
npm i -D unplugin-op-overloading
# or
bun add -d unplugin-op-overloading
```

## Usage

### Quick Start

1. **Add the plugin to your build tool:**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import OperatorOverloading from 'unplugin-op-overloading/vite'

export default defineConfig({
  plugins: [
    OperatorOverloading({
      equality: 'both', // If transforming ==, !=, ===, !==
    }),
  ],
})
```

2. **Add the directive to files using operator overloading:**

```javascript
'use operator overloading'

class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  [Symbol.for('+')](other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }
}

const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)
const sum = v1 + v2 // Vector(4, 6) ✨
```

### Build Tool Configuration

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import OperatorOverloading from 'unplugin-op-overloading/vite'

export default defineConfig({
  plugins: [
    OperatorOverloading({
      equality: 'both',
      debug: false,
    }),
  ],
})
```

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import OperatorOverloading from 'unplugin-op-overloading/rollup'

export default {
  plugins: [
    OperatorOverloading({
      equality: 'both',
    }),
  ],
}
```

<br></details>

<details>
<summary>Rolldown</summary><br>

```ts
// rolldown.config.js
import OperatorOverloading from 'unplugin-op-overloading/rolldown'

export default {
  plugins: [
    OperatorOverloading({
      equality: 'both',
    }),
  ],
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
import { build } from 'esbuild'
import OperatorOverloading from 'unplugin-op-overloading/esbuild'

build({
  plugins: [
    OperatorOverloading({
      equality: 'both',
    }),
  ],
})
```

<br></details>

<details>
<summary>Webpack</summary><br>

```js
// webpack.config.js
import OperatorOverloading from 'unplugin-op-overloading/webpack'

export default {
  plugins: [
    OperatorOverloading({
      equality: 'both',
    }),
  ],
}
```

<br></details>

<details>
<summary>Rspack</summary><br>

```ts
// rspack.config.js
import OperatorOverloading from 'unplugin-op-overloading/rspack'

export default {
  plugins: [
    OperatorOverloading({
      equality: 'both',
    }),
  ],
}
```

<br></details>

## Plugin Options

| Option     | Type                                     | Default               | Description                           |
| ---------- | ---------------------------------------- | --------------------- | ------------------------------------- |
| `equality` | `'off' \| 'loose' \| 'strict' \| 'both'` | `'off'`               | Equality operator transformation mode |
| `debug`    | `boolean`                                | `false`               | Enable debug logging                  |
| `include`  | `FilterPattern`                          | `[/\.[cm]?[jt]sx?$/]` | Files to include                      |
| `exclude`  | `FilterPattern`                          | `[/node_modules/]`    | Files to exclude                      |

### Equality Modes

- `'off'` - Don't transform equality operators (default)
- `'loose'` - Transform `==` and `!=`
- `'strict'` - Transform `===` and `!==`
- `'both'` - Transform all four equality operators

## Supported Operators

### Arithmetic Operators

```javascript
;[Symbol.for('+')](other) // a + b
  [Symbol.for('-')](other) // a - b
  [Symbol.for('*')](other) // a * b
  [Symbol.for('/')](other) // a / b
  [Symbol.for('%')](other) // a % b
  [Symbol.for('**')](other) // a ** b
```

### Comparison Operators

```javascript
;[Symbol.for('<')](other) // a < b
  [Symbol.for('>')](other) // a > b
  [Symbol.for('<=')](other) // a <= b
  [Symbol.for('>=')](other) // a >= b
```

### Equality Operators

```javascript
;[Symbol.for('==')](other) // a == b
  [Symbol.for('!=')](other) // a != b
  [Symbol.for('===')](other) // a === b
  [Symbol.for('!==')](other) // a !== b
```

### Unary Operators

```javascript
;[Symbol.for('minus')]() // -a
  [Symbol.for('plus')]() // +a
```

## Examples

### Vector Mathematics

```javascript
'use operator overloading'

class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  [Symbol.for('+')](other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  [Symbol.for('-')](other) {
    return new Vector(this.x - other.x, this.y - other.y)
  }

  [Symbol.for('*')](scalar) {
    return new Vector(this.x * scalar, this.y * scalar)
  }

  [Symbol.for('minus')]() {
    return new Vector(-this.x, -this.y)
  }

  magnitude() {
    return Math.hypot(this.x, this.y)
  }

  [Symbol.for('<')](other) {
    return this.magnitude() < other.magnitude()
  }
}

const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)

const sum = v1 + v2 // Vector(4, 6)
const diff = v1 - v2 // Vector(2, 2)
const scaled = v1 * 2 // Vector(6, 8)
const negated = -v1 // Vector(-3, -4)
const isLess = v2 < v1 // true (magnitude 2.236 < 5)
const chained = v1 + v2 * 2 // Vector(5, 8)
```

### Complex Numbers

```javascript
'use operator overloading'

class Complex {
  constructor(real, imag) {
    this.real = real
    this.imag = imag
  }

  [Symbol.for('+')](other) {
    return new Complex(this.real + other.real, this.imag + other.imag)
  }

  [Symbol.for('*')](other) {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real,
    )
  }

  toString() {
    const sign = this.imag >= 0 ? '+' : ''
    return `${this.real}${sign}${this.imag}i`
  }
}

const c1 = new Complex(1, 2)
const c2 = new Complex(3, 4)
const sum = c1 + c2 // 4+6i
const product = c1 * c2 // -5+10i
```

### Matrix Multiplication

```javascript
'use operator overloading'

function Matrix(rows) {
  return {
    rows, // [[a, b], [c, d]]

    [Symbol.for('*')](other) {
      // Row × Column multiplication
      const result = [
        [
          this.rows[0][0] * other.rows[0][0] +
            this.rows[0][1] * other.rows[1][0],
          this.rows[0][0] * other.rows[0][1] +
            this.rows[0][1] * other.rows[1][1],
        ],
        [
          this.rows[1][0] * other.rows[0][0] +
            this.rows[1][1] * other.rows[1][0],
          this.rows[1][0] * other.rows[0][1] +
            this.rows[1][1] * other.rows[1][1],
        ],
      ]
      return Matrix(result)
    },
  }
}

const A = Matrix([
  [1, 2],
  [3, 4],
])
const B = Matrix([
  [5, 6],
  [7, 8],
])
const C = A * B // Matrix([[19, 22], [43, 50]])
```

## How It Works

### Transformation Process

The plugin transforms operator expressions into method calls at build time:

**Input:**

```javascript
'use operator overloading'
const sum = a + b
```

**Output:**

```javascript
const sum = (() => {
  'operator-overloading disabled'
  const __lhs = a
  const __rhs = b
  const __sym = Symbol.for('+')
  return __lhs != null && __lhs[__sym] !== undefined
    ? __lhs[__sym](__rhs)
    : __lhs + __rhs
})()
```

### Key Features

1. **IIFE Wrapping** - Each operator is wrapped in an immediately-invoked function expression to avoid variable conflicts
2. **Fallback Behavior** - Falls back to native JavaScript operators if no custom implementation exists
3. **Null Safety** - Checks for null/undefined before calling operator methods
4. **Directive Removal** - The `"use operator overloading"` directive is removed from output

## TypeScript Support

### TypeScript Language Service Plugin

For a better IDE experience without `@ts-expect-error` comments, use the included TypeScript Language Service Plugin.

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "unplugin-op-overloading/typescript-plugin" }
    ]
  }
}
```

**VS Code Setup:**

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

Restart TypeScript server: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

**Important:** The TypeScript plugin only suppresses errors in your IDE. Running `tsc` directly will still show errors. Use build tools (Vite/Webpack) for production builds.

### TypeScript Example

```typescript
'use operator overloading'

export class Vector {
  constructor(
    public x: number,
    public y: number,
  ) {}

  [Symbol.for('+')](other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }
}

const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)
const sum = v1 + v2 // No IDE errors with TypeScript plugin!
```

## Working Example

See the complete working example in [`examples/vite-typescript/`](./examples/vite-typescript/) featuring:

- ✅ Vector operations with 7 operators
- ✅ Complex number arithmetic
- ✅ 2×2 Matrix multiplication
- ✅ Interactive frontend demo
- ✅ TypeScript Language Service Plugin configured
- ✅ Zero build warnings

```bash
cd examples/vite-typescript
bun install
bun run dev
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Source Code (.js, .ts, .tsx)           │
│  'use operator overloading'             │
│  const sum = a + b                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  unplugin-op-overloading                │
│  - Detects directive                    │
│  - Parses with oxc-parser               │
│  - Transforms operators                 │
│  - Generates sourcemaps                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Transformed Output                     │
│  const sum = (() => {                   │
│    const __lhs = a, __rhs = b           │
│    return __lhs?.[Symbol.for('+')](...)  │
│  })()                                   │
└─────────────────────────────────────────┘
```

## Performance

- ⚡ **Parsing:** Uses [oxc-parser](https://github.com/oxc-project/oxc) - one of the fastest JavaScript parsers
- 🎯 **Selective:** Only processes files with `"use operator overloading"` directive
- 📦 **Zero Runtime:** Pure compile-time transformation, no runtime library needed
- 🗺️ **Source Maps:** Full source map support for debugging

## Limitations

1. **Directive Required:** Files must include `"use operator overloading"` at the top (within first 3 lines)
2. **TypeScript CLI:** `tsc` will still show errors - use build tools for production
3. **Operator Precedence:** Follows standard JavaScript operator precedence
4. **Not a Language Feature:** This is a build-time transformation, not native JavaScript

## Testing

```bash
# Run all tests
bun run test

# Type checking
bun run typecheck

# Linting
bun run lint

# Build
bun run build
```

## Documentation

- [TypeScript Plugin Guide](./docs/typescript-plugin-guide.md)
- [Design Document](./docs/design.md)
- [Example Project](./examples/vite-typescript/)

## License

[Apache-2.0](./LICENSE) License © 2025-PRESENT [Arafat Husayn](https://github.com/arafathusayn)
