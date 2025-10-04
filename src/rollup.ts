/**
 * This entry file is for Rollup plugin.
 *
 * @module
 */

import OperatorOverloading from './index'

/**
 * Rollup plugin
 *
 * @example
 * ```ts
 * // rollup.config.js
 * import OperatorOverloading from 'unplugin-op-overloading/rollup'
 *
 * export default {
 *   plugins: [OperatorOverloading()],
 * }
 * ```
 */
const rollup = OperatorOverloading.rollup as typeof OperatorOverloading.rollup
export default rollup
export { rollup as 'module.exports' }
