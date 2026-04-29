import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',   // not needed with React 17+ JSX transform
      'react/prop-types': 'off',            // TypeScript or runtime checks handle this
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // Ignore build output and dependencies
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
]
