# Usage Example

## Installation

```bash
bun add unplugin-op-overloading
```

## Configuration

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import OperatorOverloading from 'unplugin-op-overloading/vite'

export default defineConfig({
  plugins: [
    OperatorOverloading({
      // Options (all optional)
      equality: 'off', // 'off' | 'loose' | 'strict' | 'both'
      debug: false,
      symbolsNamespace: false, // or a string like 'oo' for Symbol.for('oo/+')
    }),
  ],
})
```

### Other Bundlers

```js
// rollup.config.js
import OperatorOverloading from 'unplugin-op-overloading/rollup'

// webpack.config.js
import OperatorOverloading from 'unplugin-op-overloading/webpack'

// rspack.config.js
import OperatorOverloading from 'unplugin-op-overloading/rspack'

// esbuild
import OperatorOverloading from 'unplugin-op-overloading/esbuild'

// rolldown
import OperatorOverloading from 'unplugin-op-overloading/rolldown'

// farm
import OperatorOverloading from 'unplugin-op-overloading/farm'
```

## Usage in Code

### Enable Operator Overloading

Add the directive to the top of your file (must be in first 3 statements):

```js
"use operator overloading"

// Your code here...
```

### Vector Example

```js
"use operator overloading"

class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  // Addition
  [Symbol.for('+')](other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  // Subtraction
  [Symbol.for('-')](other) {
    return new Vector(this.x - other.x, this.y - other.y)
  }

  // Multiplication (scalar)
  [Symbol.for('*')](scalar) {
    return new Vector(this.x * scalar, this.y * scalar)
  }

  // Unary minus
  [Symbol.for('minus')]() {
    return new Vector(-this.x, -this.y)
  }

  toString() {
    return `Vector(${this.x}, ${this.y})`
  }
}

const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)

const sum = v1 + v2 // Vector(4, 6)
const diff = v1 - v2 // Vector(2, 2)
const scaled = v1 * 2 // Vector(6, 8)
const negated = -v1 // Vector(-3, -4)

console.log(sum.toString()) // "Vector(4, 6)"
```

### Complex Numbers

```js
"use operator overloading"

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
      this.real * other.imag + this.imag * other.real
    )
  }

  toString() {
    return `${this.real} + ${this.imag}i`
  }
}

const a = new Complex(1, 2)
const b = new Complex(3, 4)

const sum = a + b // Complex(4, 6)
const product = a * b // Complex(-5, 10)
```

### Equality Operators (Opt-in)

To enable equality operator overloading, configure the plugin:

```ts
OperatorOverloading({
  equality: 'loose', // enables == and !=
  // or 'strict' for === and !==
  // or 'both' for all four
})
```

Then in your code:

```js
"use operator overloading"

class Money {
  constructor(amount, currency) {
    this.amount = amount
    this.currency = currency
  }

  [Symbol.for('==')]( other) {
    return this.amount === other.amount && this.currency === other.currency
  }
}

const m1 = new Money(100, 'USD')
const m2 = new Money(100, 'USD')
const m3 = new Money(100, 'EUR')

console.log(m1 == m2) // true (custom equality)
console.log(m1 == m3) // false (different currency)
```

## Supported Operators

### Binary Operators (LHS dispatch)
- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**`
- Bitwise: `&`, `|`, `^`, `<<`, `>>`, `>>>`
- Relational: `<`, `<=`, `>`, `>=`

### Special: `in` operator (RHS dispatch)
```js
[Symbol.for('in')](key) {
  return key in this.data
}
```

### Unary Operators
- `+` → Symbol.for('plus')
- `-` → Symbol.for('minus')
- `~` → Symbol.for('~')
- `!` → Symbol.for('!')

### Equality (Option-gated)
- `==`, `!=` (loose mode)
- `===`, `!==` (strict mode)

## How It Works

The plugin transforms operator expressions into IIFEs that:

1. Check if the operand has a custom operator method via `Symbol.for(op)`
2. Call the custom method if it exists
3. Fall back to native JavaScript behavior otherwise

### Before (Source):
```js
"use operator overloading"
const result = a + b
```

### After (Transformed):
```js
;(() => {
  "operator-overloading disabled";
  const __lhs = a;
  const __rhs = b;
  const __sym = Symbol.for("+");
  return __lhs != null && __lhs[__sym] !== undefined
    ? __lhs[__sym](__rhs)
    : (__lhs + __rhs);
})()
```

## Limitations

- **Not supported**: `&&`, `||`, `??` (short-circuiting semantics)
- **Not supported**: `typeof`, `void`, `instanceof` (use `Symbol.hasInstance` for instanceof)
- **File-level opt-in**: Only files with the directive are transformed
- **Performance**: Small runtime overhead from IIFE wrapping
