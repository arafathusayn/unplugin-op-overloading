import OperatorOverloading from 'unplugin-op-overloading/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    OperatorOverloading({
      // Enable debug mode to see transformation details
      debug: false,
      // Support equality operators (optional)
      equality: 'both', // 'off' | 'loose' | 'strict' | 'both'
    }),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warning
        // The directive is used by unplugin-op-overloading during transformation
        // and is not needed in the bundled output
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        // Suppress sourcemap warnings related to directives
        if (
          warning.code === 'SOURCEMAP_ERROR' &&
          warning.message.includes('resolve original location')
        ) {
          return
        }
        warn(warning)
      },
    },
  },
})
