/**
 * This entry file is for Farm plugin.
 *
 * @module
 */

import OperatorOverloading from './index'

/**
 * Farm plugin
 *
 * @example
 * ```ts
 * // farm.config.js
 * import OperatorOverloading from 'unplugin-op-overloading/farm'
 *
 * export default {
 *   plugins: [OperatorOverloading()],
 * }
 * ```
 */
const farm = OperatorOverloading.farm as typeof OperatorOverloading.farm
export default farm
export { farm as 'module.exports' }
