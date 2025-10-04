import { sxzz } from '@sxzz/eslint-config'
export default sxzz(
  { markdown: false },
  {
    ignores: [
      // Files with custom operator syntax that ESLint cannot parse
      'examples/vite-typescript/src/simple.js',
    ],
  },
  {
    rules: {
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
)
