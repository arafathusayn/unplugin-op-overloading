/**
 * This entry file is for webpack plugin.
 *
 * @module
 */

import OperatorOverloading from './index'

/**
 * Webpack plugin
 *
 * @example
 * ```js
 * // webpack.config.js
 * import OperatorOverloading from 'unplugin-op-overloading/webpack'
 *
 * export default {
 *   plugins: [OperatorOverloading()],
 * }
 * ```
 */
const webpack =
  OperatorOverloading.webpack as typeof OperatorOverloading.webpack
export default webpack
export { webpack as 'module.exports' }
