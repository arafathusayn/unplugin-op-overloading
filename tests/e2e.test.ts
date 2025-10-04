import { describe, expect, it } from 'vitest'
import { resolveOptions } from '../src/core/options'
import { transform } from '../src/core/transformer'

/**
 * Execute transformed code and return the result
 */
function executeTransformed(code: string, options = resolveOptions({})): any {
  // Trim leading/trailing whitespace to ensure directive is detected
  const trimmed = code.trim()
  const result = transform(trimmed, 'test.js', options)
  if (!result) {
    throw new Error('Transform returned null')
  }

  // Create a function from the transformed code and execute it

  const fn = new Function(`${result.code}\nreturn result;`)
  return fn()
}

describe('E2E: Vector class', () => {
  it('should add two vectors using + operator', () => {
    const code = `
      "use operator overloading"

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
      const result = v1 + v2
    `

    const result = executeTransformed(code)
    expect(result.x).toBe(4)
    expect(result.y).toBe(6)
  })

  it('should subtract two vectors using - operator', () => {
    const code = `
      "use operator overloading"

      class Vector {
        constructor(x, y) {
          this.x = x
          this.y = y
        }

        [Symbol.for('-')](other) {
          return new Vector(this.x - other.x, this.y - other.y)
        }
      }

      const v1 = new Vector(5, 7)
      const v2 = new Vector(2, 3)
      const result = v1 - v2
    `

    const result = executeTransformed(code)
    expect(result.x).toBe(3)
    expect(result.y).toBe(4)
  })

  it('should multiply vector by scalar', () => {
    const code = `
      "use operator overloading"

      class Vector {
        constructor(x, y) {
          this.x = x
          this.y = y
        }

        [Symbol.for('*')](scalar) {
          return new Vector(this.x * scalar, this.y * scalar)
        }
      }

      const v = new Vector(3, 4)
      const result = v * 2
    `

    const result = executeTransformed(code)
    expect(result.x).toBe(6)
    expect(result.y).toBe(8)
  })

  it('should negate vector using unary - operator', () => {
    const code = `
      "use operator overloading"

      class Vector {
        constructor(x, y) {
          this.x = x
          this.y = y
        }

        [Symbol.for('minus')]() {
          return new Vector(-this.x, -this.y)
        }
      }

      const v = new Vector(3, 4)
      const result = -v
    `

    const result = executeTransformed(code)
    expect(result.x).toBe(-3)
    expect(result.y).toBe(-4)
  })
})

describe('E2E: Complex numbers', () => {
  it('should add complex numbers', () => {
    const code = `
      "use operator overloading"

      class Complex {
        constructor(real, imag) {
          this.real = real
          this.imag = imag
        }

        [Symbol.for('+')](other) {
          return new Complex(
            this.real + other.real,
            this.imag + other.imag
          )
        }
      }

      const a = new Complex(1, 2)
      const b = new Complex(3, 4)
      const result = a + b
    `

    const result = executeTransformed(code)
    expect(result.real).toBe(4)
    expect(result.imag).toBe(6)
  })

  it('should multiply complex numbers', () => {
    const code = `
      "use operator overloading"

      class Complex {
        constructor(real, imag) {
          this.real = real
          this.imag = imag
        }

        [Symbol.for('*')](other) {
          return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
          )
        }
      }

      const a = new Complex(1, 2)
      const b = new Complex(3, 4)
      const result = a * b
    `

    const result = executeTransformed(code)
    expect(result.real).toBe(-5) // (1*3 - 2*4) = 3 - 8 = -5
    expect(result.imag).toBe(10) // (1*4 + 2*3) = 4 + 6 = 10
  })
})

describe('E2E: Custom "in" operator', () => {
  it('should use custom "in" operator (RHS dispatch)', () => {
    const code = `
      "use operator overloading"

      class CustomMap {
        constructor(data) {
          this.data = data
        }

        [Symbol.for('in')](key) {
          return this.data.hasOwnProperty(key)
        }
      }

      const map = new CustomMap({ foo: 1, bar: 2 })
      const result = 'foo' in map
    `

    const result = executeTransformed(code)
    expect(result).toBe(true)
  })

  it('should return false for missing keys with custom "in"', () => {
    const code = `
      "use operator overloading"

      class CustomMap {
        constructor(data) {
          this.data = data
        }

        [Symbol.for('in')](key) {
          return this.data.hasOwnProperty(key)
        }
      }

      const map = new CustomMap({ foo: 1 })
      const result = 'baz' in map
    `

    const result = executeTransformed(code)
    expect(result).toBe(false)
  })
})

describe('E2E: Fallback to native behavior', () => {
  it('should use native addition when no operator method exists', () => {
    const code = `
      "use operator overloading"

      const a = 5
      const b = 3
      const result = a + b
    `

    const result = executeTransformed(code)
    expect(result).toBe(8)
  })

  it('should use native multiplication for plain objects', () => {
    const code = `
      "use operator overloading"

      const result = 4 * 7
    `

    const result = executeTransformed(code)
    expect(result).toBe(28)
  })

  it('should handle null/undefined gracefully', () => {
    const code = `
      "use operator overloading"

      const a = null
      const b = 5
      const result = a + b
    `

    const result = executeTransformed(code)
    expect(result).toBe(5) // null + 5 = 5 in JS
  })
})

describe('E2E: Equality operators', () => {
  it('should NOT transform equality by default', () => {
    const code = `
      "use operator overloading"

      class Money {
        constructor(amount) {
          this.amount = amount
        }

        [Symbol.for('==')](_other) {
          throw new Error('Should not be called')
        }

        [Symbol.for('+')](other) {
          return new Money(this.amount + other.amount)
        }
      }

      const m1 = new Money(100)
      const m2 = new Money(100)
      const _dummy = m1 + m2  // Ensure transform happens (not for equality)
      const result = m1 == m2  // But == should use native behavior
    `

    // With equality: 'off' (default), the == operator should use native behavior
    // The transform WILL happen (for the + operator), but == won't be overloaded
    const result = executeTransformed(code)
    expect(result).toBe(false) // Native behavior: different objects (no custom method called)
  })

  it('should transform == with loose equality mode', () => {
    const code = `
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
      const result = m1 == m2
    `

    const options = resolveOptions({ equality: 'loose' })
    const result = executeTransformed(code, options)
    expect(result).toBe(true)
  })

  it('should transform === with strict equality mode', () => {
    const code = `
      "use operator overloading"

      class Point {
        constructor(x, y) {
          this.x = x
          this.y = y
        }

        [Symbol.for('===')]( other) {
          return this.x === other.x && this.y === other.y
        }
      }

      const p1 = new Point(3, 4)
      const p2 = new Point(3, 4)
      const result = p1 === p2
    `

    const options = resolveOptions({ equality: 'strict' })
    const result = executeTransformed(code, options)
    expect(result).toBe(true)
  })

  it('should normalize equality results to boolean', () => {
    const code = `
      "use operator overloading"

      class Fuzzy {
        constructor(value) {
          this.value = value
        }

        [Symbol.for('==')](_other) {
          return "truthy string"  // Non-boolean return
        }
      }

      const f1 = new Fuzzy(1)
      const f2 = new Fuzzy(2)
      const result = f1 == f2
    `

    const options = resolveOptions({ equality: 'loose' })
    const result = executeTransformed(code, options)
    expect(typeof result).toBe('boolean')
    expect(result).toBe(true) // Normalized to boolean
  })
})

describe('E2E: Relational operators', () => {
  it('should compare vectors by magnitude using < operator', () => {
    const code = `
      "use operator overloading"

      class Vector {
        constructor(x, y) {
          this.x = x
          this.y = y
        }

        magnitude() {
          return Math.sqrt(this.x * this.x + this.y * this.y)
        }

        [Symbol.for('<')](other) {
          return this.magnitude() < other.magnitude()
        }
      }

      const v1 = new Vector(1, 1)  // magnitude ≈ 1.41
      const v2 = new Vector(3, 4)  // magnitude = 5
      const result = v1 < v2
    `

    const result = executeTransformed(code)
    expect(result).toBe(true)
  })
})

describe('E2E: Bitwise operators', () => {
  it('should perform bitwise AND with custom logic', () => {
    const code = `
      "use operator overloading"

      class Flags {
        constructor(value) {
          this.value = value
        }

        [Symbol.for('&')](other) {
          return new Flags(this.value & other.value)
        }
      }

      const f1 = new Flags(0b1010)
      const f2 = new Flags(0b1100)
      const result = f1 & f2
    `

    const result = executeTransformed(code)
    expect(result.value).toBe(0b1000) // 0b1010 & 0b1100 = 0b1000
  })
})

describe('E2E: Unary operators', () => {
  it('should use unary + operator', () => {
    const code = `
      "use operator overloading"

      class Temperature {
        constructor(celsius) {
          this.celsius = celsius
        }

        [Symbol.for('plus')]() {
          return this.celsius + 273.15  // Convert to Kelvin
        }
      }

      const temp = new Temperature(0)
      const result = +temp
    `

    const result = executeTransformed(code)
    expect(result).toBe(273.15)
  })

  it('should use bitwise NOT operator', () => {
    const code = `
      "use operator overloading"

      class Binary {
        constructor(value) {
          this.value = value
        }

        [Symbol.for('~')]() {
          return new Binary(~this.value)
        }
      }

      const b = new Binary(5)
      const result = ~b
    `

    const result = executeTransformed(code)
    expect(result.value).toBe(-6) // ~5 = -6 in two's complement
  })

  it('should use logical NOT operator', () => {
    const code = `
      "use operator overloading"

      class Toggleable {
        constructor(value) {
          this.value = value
        }

        [Symbol.for('!')]() {
          return new Toggleable(!this.value)
        }
      }

      const t = new Toggleable(true)
      const result = !t
    `

    const result = executeTransformed(code)
    expect(result.value).toBe(false)
  })
})

describe('E2E: Chained operations', () => {
  it('should handle chained operator calls', () => {
    const code = `
      "use operator overloading"

      class Num {
        constructor(value) {
          this.value = value
        }

        [Symbol.for('+')](other) {
          return new Num(this.value + other.value)
        }

        [Symbol.for('*')](other) {
          return new Num(this.value * other.value)
        }
      }

      const a = new Num(2)
      const b = new Num(3)
      const c = new Num(4)
      const result = a + b * c  // Should respect precedence: 2 + (3 * 4) = 14
    `

    const result = executeTransformed(code)
    expect(result.value).toBe(14)
  })
})

describe('E2E: Without directive (no transformation)', () => {
  it('should NOT transform without directive', () => {
    const code = `
      // No directive here

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
      const result = v1 + v2
    `

    const transformed = transform(code, 'test.js', resolveOptions({}))
    expect(transformed).toBeNull() // No transformation without directive
  })
})

describe('E2E: Namespace support', () => {
  it('should use namespaced symbols', () => {
    const code = `
      "use operator overloading"

      class Value {
        constructor(n) {
          this.n = n
        }

        [Symbol.for('myapp/+')](other) {
          return new Value(this.n + other.n + 100)
        }
      }

      const a = new Value(1)
      const b = new Value(2)
      const result = a + b
    `

    const options = resolveOptions({ symbolsNamespace: 'myapp' })
    const result = executeTransformed(code, options)
    expect(result.n).toBe(103) // 1 + 2 + 100
  })
})
