import type { FilterPattern } from 'unplugin-utils'

/**
 * Operator overloading plugin options
 */
export interface Options {
  /**
   * Equality operator overloading mode.
   * - 'off': do not touch ==/!=/===/!== (default)
   * - 'loose': transform == and !=
   * - 'strict': transform === and !==
   * - 'both': transform all four
   */
  equality?: 'off' | 'loose' | 'strict' | 'both'

  /**
   * Files to include (advisory filters on top of per-file directive gate)
   */
  include?: FilterPattern

  /**
   * Files to exclude
   */
  exclude?: FilterPattern

  /**
   * Plugin enforcement order (pre/post)
   */
  enforce?: 'pre' | 'post' | undefined

  /**
   * Enable debug logging
   */
  debug?: boolean

  /**
   * Optional namespace prefix for Symbol.for keys to avoid global registry collisions.
   * Example: 'oo' → Symbol.for('oo/+'), 'oo/=='...
   */
  symbolsNamespace?: string | false
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type OptionsResolved = Overwrite<
  Required<Options>,
  Pick<Options, 'enforce' | 'symbolsNamespace'>
>

export function resolveOptions(options: Options): OptionsResolved {
  return {
    equality: options.equality || 'off',
    include: options.include || [/\.[cm]?[jt]sx?$/],
    exclude: options.exclude || [/node_modules/],
    enforce: 'enforce' in options ? options.enforce : 'pre',
    debug: options.debug || false,
    symbolsNamespace: options.symbolsNamespace ?? false,
  }
}
