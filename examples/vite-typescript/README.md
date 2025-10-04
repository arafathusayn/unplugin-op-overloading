# Operator Overloading - Vite + TypeScript Example

This example demonstrates how to use `unplugin-op-overloading` in a Vite + TypeScript project.

## Features

- ✅ Vector operations with custom operators (+, -, *, unary -)
- ✅ Complex number arithmetic
- ✅ Chained operations with correct precedence
- ✅ TypeScript strict mode enabled
- ✅ Bun workspace integration for local development

## Quick Start

```bash
# Install dependencies (from project root)
bun install

# Development mode
bun run dev

# Build for production
bun run build

# Type checking
bun run typecheck

# Preview production build
bun run preview
```

## How It Works

1. **Add the directive**: Files using operator overloading must include `"use operator overloading"` at the top
2. **Define operators**: Use `Symbol.for('operator')` methods in your classes
3. **Use naturally**: Write `a + b` instead of `a[Symbol.for('+')](b)`

## Example Usage

```typescript
'use operator overloading'

class Vector {
  constructor(public x: number, public y: number) {}

  [Symbol.for('+')](other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }
}

const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)

// @ts-expect-error - Operator overloading not supported by TypeScript
const sum = v1 + v2 // Vector(4, 6)
```

## TypeScript Support

TypeScript doesn't natively support operator overloading types. For arithmetic operators (+, -, *, /), you need to add `// @ts-expect-error` comments above operator usage. Unary and comparison operators don't require this.

## Learn More

- [unplugin-op-overloading Documentation](../../README.md)
- [Design Document](../../docs/design.md)
- [E2E Test Results](../../docs/e2e-test-results.md)
