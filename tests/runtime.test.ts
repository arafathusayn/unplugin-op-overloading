import { describe, expect, it } from 'vitest'
import { resolveOptions } from '../src/core/options'
import { transform } from '../src/core/transformer'

describe('Runtime Execution', () => {
  it('should execute transformed Vector addition', () => {
    const code = `
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
const sum = v1 + v2

// Export for verification
globalThis.__testResult = { x: sum.x, y: sum.y }
`

    const result = transform(
      code,
      'test.js',
      resolveOptions({ equality: 'both' }),
    )

    expect(result).toBeTruthy()
    expect(result!.code).not.toContain('"use operator overloading"')
    expect(result!.code).toContain('Symbol.for')

    // Execute the transformed code
    eval(result!.code)

    // Verify the result
    const testResult = (globalThis as any).__testResult
    expect(testResult).toEqual({ x: 4, y: 6 })
  })

  it('should execute transformed Complex number multiplication', () => {
    const code = `
'use operator overloading'

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

const c1 = new Complex(2, 3)
const c2 = new Complex(4, 5)
const product = c1 * c2

globalThis.__testComplexResult = { real: product.real, imag: product.imag }
`

    const result = transform(
      code,
      'test.js',
      resolveOptions({ equality: 'both' }),
    )

    expect(result).toBeTruthy()

    // Execute the transformed code
    eval(result!.code)

    // Verify the result: (2+3i) * (4+5i) = 8 + 10i + 12i + 15i² = 8 + 22i - 15 = -7 + 22i
    const testResult = (globalThis as any).__testComplexResult
    expect(testResult).toEqual({ real: -7, imag: 22 })
  })

  it('should execute transformed unary minus operator', () => {
    const code = `
'use operator overloading'

class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  [Symbol.for('minus')]() {
    return new Vector(-this.x, -this.y)
  }
}

const v = new Vector(5, 10)
const negated = -v

globalThis.__testNegatedResult = { x: negated.x, y: negated.y }
`

    const result = transform(
      code,
      'test.js',
      resolveOptions({ equality: 'both' }),
    )

    expect(result).toBeTruthy()

    // Execute the transformed code
    eval(result!.code)

    // Verify the result
    const testResult = (globalThis as any).__testNegatedResult
    expect(testResult).toEqual({ x: -5, y: -10 })
  })

  it('should execute transformed comparison operators', () => {
    const code = `
'use operator overloading'

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

const v1 = new Vector(3, 4)  // magnitude = 5
const v2 = new Vector(6, 8)  // magnitude = 10

globalThis.__testComparisonResult = v1 < v2
`

    const result = transform(
      code,
      'test.js',
      resolveOptions({ equality: 'both' }),
    )

    expect(result).toBeTruthy()

    // Execute the transformed code
    eval(result!.code)

    // Verify the result
    const testResult = (globalThis as any).__testComparisonResult
    expect(testResult).toBe(true)
  })

  it('should execute matrix multiplication', () => {
    const code = `
'use operator overloading'

function Matrix(rows) {
  return {
    rows,
    [Symbol.for('*')](other) {
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

// [1 2] * [5 6] = [1*5+2*7  1*6+2*8] = [19 22]
// [3 4]   [7 8]   [3*5+4*7  3*6+4*8]   [43 50]
const A = Matrix([[1, 2], [3, 4]])
const B = Matrix([[5, 6], [7, 8]])
const C = A * B

globalThis.__testMatrixResult = C.rows
`

    const result = transform(
      code,
      'test.js',
      resolveOptions({ equality: 'both' }),
    )

    expect(result).toBeTruthy()

    // Execute the transformed code
    eval(result!.code)

    // Verify the result
    const testResult = (globalThis as any).__testMatrixResult
    expect(testResult).toEqual([
      [19, 22],
      [43, 50],
    ])
  })

  it('should execute chained operations', () => {
    const code = `
'use operator overloading'

class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  [Symbol.for('+')](other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  [Symbol.for('*')](scalar) {
    return new Vector(this.x * scalar, this.y * scalar)
  }
}

const v1 = new Vector(1, 2)
const v2 = new Vector(3, 4)
// Should execute as: v1 + (v2 * 2) = (1,2) + (6,8) = (7,10)
const result = v1 + v2 * 2

globalThis.__testChainedResult = { x: result.x, y: result.y }
`

    const result = transform(
      code,
      'test.js',
      resolveOptions({ equality: 'both' }),
    )

    expect(result).toBeTruthy()

    // Execute the transformed code
    eval(result!.code)

    // Verify the result
    const testResult = (globalThis as any).__testChainedResult
    expect(testResult).toEqual({ x: 7, y: 10 })
  })
})
