import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-empty': 'off',
      // Architecture: prevent imports from old path and deep cross-feature imports
      'no-restricted-imports': ['error', {
        patterns: [
          // disallow old central courses lib
          {
            group: ['../lib/courses', '../../lib/courses', '@/lib/courses', '**/src/lib/courses', 'src/lib/courses'],
            message: 'Use src/features/courses/lib/courses instead.'
          },
          // discourage deep imports across features (allow only through feature public API)
          {
            group: ['src/features/*/**', '!src/features/*/index.{js,ts,jsx,tsx}'],
            message: 'Import from another feature only via its index public API.'
          }
        ]
      }],
    },
  },
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-empty': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['src/context/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
