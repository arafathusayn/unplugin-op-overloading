/**
 * This entry file is for Vite plugin.
 *
 * @module
 */

import OperatorOverloading from './index'

/**
 * Vite plugin
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import OperatorOverloading from 'unplugin-op-overloading/vite'
 *
 * export default defineConfig({
 *   plugins: [OperatorOverloading()],
 * })
 * ```
 */
const vite = OperatorOverloading.vite as typeof OperatorOverloading.vite
export default vite
export { vite as 'module.exports' }
