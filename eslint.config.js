import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'release', 'electron']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
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
      // Complexity ceilings set at the largest value in src/ today, so the
      // code can only get simpler. Lower them when a hotspot is split.
      // Current maximum of each rule: docs/adr/014-codeql-static-analysis.md
      complexity: ['error', 58],
      'max-depth': ['error', 6],
      'max-params': ['error', 5],
      'max-lines-per-function': [
        'error',
        { max: 543, skipBlankLines: true, skipComments: true },
      ],
    },
  },
])
