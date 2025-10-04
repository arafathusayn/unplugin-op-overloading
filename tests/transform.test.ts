import { describe, expect, it } from 'vitest'
import { resolveOptions } from '../src/core/options'
import { transform } from '../src/core/transformer'

describe('transform', () => {
  const options = resolveOptions({})

  it('should transform binary addition operator', () => {
    const code = '"use operator overloading"\nconst result = a + b;'
    const result = transform(code, 'test.js', options)

    expect(result).toBeTruthy()
    expect(result?.code).toContain('Symbol.for')
    expect(result?.code).toContain('"operator-overloading disabled"')
  })

  it('should transform multiple operators', () => {
    const code = `"use operator overloading"
const sum = a + b;
const diff = x - y;
const product = m * n;`

    const result = transform(code, 'test.js', options)

    expect(result).toBeTruthy()
    expect(result?.code).toContain('Symbol.for("+")')
    expect(result?.code).toContain('Symbol.for("-")')
    expect(result?.code).toContain('Symbol.for("*")')
  })

  it('should handle the "in" operator specially (RHS dispatch)', () => {
    const code = `"use operator overloading"\nconst has = key in obj;`
    const result = transform(code, 'test.js', options)

    expect(result).toBeTruthy()
    expect(result?.code).toContain('Symbol.for("in")')
    expect(result?.code).toContain('__obj[__sym](__key)')
    expect(result?.code).toContain('__key in __obj')
  })

  it('should transform unary operators', () => {
    const code = `"use operator overloading"\nconst neg = -x;`
    const result = transform(code, 'test.js', options)

    expect(result).toBeTruthy()
    expect(result?.code).toContain('Symbol.for("minus")')
  })

  it('should NOT transform equality operators by default', () => {
    const code = `"use operator overloading"\nconst equal = a == b;`
    const result = transform(code, 'test.js', options)

    // Should not transform since equality is 'off' by default
    expect(result?.code || code).not.toContain('Symbol.for("==")')
  })

  it('should transform equality when enabled', () => {
    const opts = resolveOptions({ equality: 'loose' })
    const code = `"use operator overloading"\nconst equal = a == b;`
    const result = transform(code, 'test.js', opts)

    expect(result).toBeTruthy()
    expect(result?.code).toContain('Symbol.for("==")')
  })

  it('should generate sourcemap', () => {
    const code = `"use operator overloading"\nconst result = a + b;`
    const result = transform(code, 'test.js', options)

    expect(result?.map).toBeTruthy()
  })

  it('should preserve original behavior in fallback', () => {
    const code = `"use operator overloading"\nconst result = a + b;`
    const result = transform(code, 'test.js', options)

    expect(result?.code).toContain('(__lhs + __rhs)')
  })
})
