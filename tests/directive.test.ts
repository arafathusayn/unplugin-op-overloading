import { describe, expect, it } from 'vitest'
import { hasDirective } from '../src/core/directive'

describe('directive detection', () => {
  it('should detect directive in first statement', () => {
    const code = `"use operator overloading"\nconst x = 1;`
    expect(hasDirective(code)).toBe(true)
  })

  it('should detect directive in second statement', () => {
    const code = `"use strict"\n"use operator overloading"\nconst x = 1;`
    expect(hasDirective(code)).toBe(true)
  })

  it('should detect directive in third statement', () => {
    const code = `"use strict"\n"use client"\n"use operator overloading"\nconst x = 1;`
    expect(hasDirective(code)).toBe(true)
  })

  it('should NOT detect directive after third statement', () => {
    const code = `const a = 1;\nconst b = 2;\nconst c = 3;\n"use operator overloading"`
    expect(hasDirective(code)).toBe(false)
  })

  it('should NOT detect directive in 4th statement', () => {
    const code = `"use strict"\n"use client"\nconst x = 1;\n"use operator overloading"`
    expect(hasDirective(code)).toBe(false)
  })

  it('should return false for empty code', () => {
    expect(hasDirective('')).toBe(false)
  })

  it('should return false when directive is not present', () => {
    const code = `"use strict"\nconst x = 1;`
    expect(hasDirective(code)).toBe(false)
  })

  it('should work with single quotes', () => {
    const code = `'use operator overloading'\nconst x = 1;`
    expect(hasDirective(code)).toBe(true)
  })

  it('should work with TypeScript', () => {
    const code = `"use operator overloading"\ntype X = number;`
    expect(hasDirective(code, 'input.ts')).toBe(true)
  })

  it('should work with JSX', () => {
    const code = `"use operator overloading"\nimport React from 'react';`
    expect(hasDirective(code)).toBe(true)
  })
})
