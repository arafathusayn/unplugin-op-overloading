'use operator overloading'

/**
 * Simple 2x2 Matrix for demonstration
 */
export function Matrix(rows) {
  return {
    rows,

    [Symbol.for('*')](other) {
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

    toString() {
      return `[${this.rows[0].join(' ')}]\n[${this.rows[1].join(' ')}]`
    },
  }
}

export function multiply(a, b) {
  return a * b // operator overloading for row-column multiplication
}
