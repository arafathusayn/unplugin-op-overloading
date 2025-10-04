/**
 * This entry file is for Rspack plugin.
 *
 * @module
 */

import OperatorOverloading from './index'

/**
 * Rspack plugin
 *
 * @example
 * ```js
 * // rspack.config.js
 * import OperatorOverloading from 'unplugin-op-overloading/rspack'
 *
 * export default {
 *   plugins: [OperatorOverloading()],
 * }
 * ```
 */
const rspack = OperatorOverloading.rspack as typeof OperatorOverloading.rspack
export default rspack
export { rspack as 'module.exports' }
