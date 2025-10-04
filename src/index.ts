import { createUnplugin, type UnpluginInstance } from 'unplugin'
import { createFilter } from 'unplugin-utils'
import { hasDirective } from './core/directive'
import { resolveOptions, type Options } from './core/options'
import { transform } from './core/transformer'

export const OperatorOverloading: UnpluginInstance<Options | undefined, false> =
  createUnplugin((rawOptions = {}) => {
    const options = resolveOptions(rawOptions)
    const filter = createFilter(options.include, options.exclude)

    const name = 'unplugin-operator-overloading'
    return {
      name,
      enforce: options.enforce,

      transformInclude(id) {
        return filter(id)
      },

      transform(code, id) {
        // Early opt-in gate: only transform files with the directive
        if (!hasDirective(code, id)) {
          return null
        }

        if (options.debug) {
          console.info(`[${name}] Transforming: ${id}`)
        }

        return transform(code, id, options)
      },
    }
  })

export default OperatorOverloading

// Export for convenience
export { type Options }
