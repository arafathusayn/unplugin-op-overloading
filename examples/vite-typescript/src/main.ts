// @ts-expect-error
import { Matrix, multiply } from './simple.js'
import { runComplexDemo, runVectorDemo } from './vector-demo.ts'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Operator Overloading Demo</h1>
    <div class="card">
      <button id="vector-demo" type="button">Run Vector Demo</button>
      <button id="complex-demo" type="button" style="display: none;">Run Complex Number Demo</button>
      <button id="matrix-demo" type="button">Run Matrix Multiplication Demo</button>
      <p id="demo-result" style="margin-top: 1rem; font-weight: bold;"></p>
      <pre id="matrix-result" style="margin-top: 1rem; font-family: monospace; text-align: left;"></pre>
    </div>
    <p class="read-the-docs">
      Open the browser console to see operator overloading in action!
    </p>
  </div>
`

// Vector demo button
document
  .querySelector<HTMLButtonElement>('#vector-demo')!
  .addEventListener('click', () => {
    const result = runVectorDemo()
    document.querySelector<HTMLParagraphElement>('#demo-result')!.textContent =
      result
    document.querySelector<HTMLPreElement>('#matrix-result')!.textContent = ''
  })

// Complex demo button
document
  .querySelector<HTMLButtonElement>('#complex-demo')!
  .addEventListener('click', () => {
    const result = runComplexDemo()
    document.querySelector<HTMLParagraphElement>('#demo-result')!.textContent =
      result
    document.querySelector<HTMLPreElement>('#matrix-result')!.textContent = ''
  })

// Matrix demo button
document
  .querySelector<HTMLButtonElement>('#matrix-demo')!
  .addEventListener('click', () => {
    const A = Matrix([
      [1, 2],
      [3, 4],
    ])
    const B = Matrix([
      [5, 6],
      [7, 8],
    ])

    // Use operator overloading: A * B
    const C = multiply(A, B)

    console.info('Matrix A:')
    console.info(A.toString())
    console.info('\nMatrix B:')
    console.info(B.toString())
    console.info('\nA * B =')
    console.info(C.toString())

    const output = `Matrix A:
${A.toString()}

Matrix B:
${B.toString()}

A * B = (using operator overloading)
${C.toString()}`

    // document.querySelector<HTMLParagraphElement>('#demo-result')!.textContent =
    // '✅ Matrix multiplication complete! Check console for details.'
    document.querySelector<HTMLPreElement>('#matrix-result')!.textContent =
      output
  })
