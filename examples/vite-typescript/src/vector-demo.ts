'use operator overloading'

/**
 * Vector class with operator overloading
 */
export class Vector {
  constructor(
    public x: number,
    public y: number,
  ) {}

  // Addition operator
  [Symbol.for('+')](other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  // Subtraction operator
  [Symbol.for('-')](other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y)
  }

  // Multiplication by scalar
  [Symbol.for('*')](scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar)
  }

  // Unary negation
  [Symbol.for('minus')](): Vector {
    return new Vector(-this.x, -this.y)
  }

  // Magnitude for comparison
  magnitude(): number {
    return Math.hypot(this.x, this.y)
  }

  // Less than comparison (by magnitude)
  [Symbol.for('<')](other: Vector): boolean {
    return this.magnitude() < other.magnitude()
  }

  // Equality comparison
  [Symbol.for('===')](other: Vector): boolean {
    return this.x === other.x && this.y === other.y
  }

  toString(): string {
    return `Vector(${this.x}, ${this.y})`
  }
}

/**
 * Complex number class with operator overloading
 */
export class Complex {
  constructor(
    public real: number,
    public imag: number,
  ) {}

  [Symbol.for('+')](other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag)
  }

  [Symbol.for('*')](other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real,
    )
  }

  toString(): string {
    const sign = this.imag >= 0 ? '+' : ''
    return `${this.real}${sign}${this.imag}i`
  }
}

export function runVectorDemo(): string {
  const v1 = new Vector(3, 4)
  const v2 = new Vector(1, 2)

  const sum = v1 + v2
  console.info(`${v1} + ${v2} = ${sum}`)

  const diff = v1 - v2
  console.info(`${v1} - ${v2} = ${diff}`)

  const scaled = v1 * 2
  console.info(`${v1} * 2 = ${scaled}`)

  const negated = -v1
  console.info(`-${v1} = ${negated}`)

  const isLess = v2 < v1
  console.info(`${v2} < ${v1} = ${isLess}`)

  const chained = v1 + v2 * 2
  console.info(`${v1} + ${v2} * 2 = ${chained}`)

  return `✅ Vector demo complete! Check console for results.`
}

export function runComplexDemo(): string {
  const c1 = new Complex(1, 2)
  const c2 = new Complex(3, 4)

  const sum = c1 + c2
  console.info(`${c1} + ${c2} = ${sum}`)

  const product = c1 * c2
  console.info(`${c1} * ${c2} = ${product}`)

  return `✅ Complex number demo complete! Check console for results.`
}
