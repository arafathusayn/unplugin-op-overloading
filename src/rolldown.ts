/**
 * This entry file is for Rolldown plugin.
 *
 * @module
 */

import OperatorOverloading from './index'

/**
 * Rolldown plugin
 *
 * @example
 * ```ts
 * // rolldown.config.js
 * import OperatorOverloading from 'unplugin-op-overloading/rolldown'
 *
 * export default {
 *   plugins: [OperatorOverloading()],
 * }
 * ```
 */
const rolldown =
  OperatorOverloading.rolldown as typeof OperatorOverloading.rolldown
export default rolldown
export { rolldown as 'module.exports' }
