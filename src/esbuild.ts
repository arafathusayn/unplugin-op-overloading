/**
 * This entry file is for esbuild plugin.
 *
 * @module
 */

import OperatorOverloading from './index'

/**
 * Esbuild plugin
 *
 * @example
 * ```ts
 * import { build } from 'esbuild'
 * import OperatorOverloading from 'unplugin-op-overloading/esbuild'
 *
 * build({ plugins: [OperatorOverloading()] })
```
 */
const esbuild =
  OperatorOverloading.esbuild as typeof OperatorOverloading.esbuild
export default esbuild
export { esbuild as 'module.exports' }
