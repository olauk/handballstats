import pluginVitest from 'eslint-plugin-vitest';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        global: 'readonly',
        firebase: 'readonly',
        navigator: 'readonly',
        FileReader: 'readonly',
      },
    },
    rules: {
      indent: 'off', // Existing code uses 4 spaces
      'linebreak-style': ['error', 'unix'],
      quotes: ['warn', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['warn', '1tbs'],
      'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }],
      complexity: ['warn', 10],
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    plugins: {
      vitest: pluginVitest,
    },
    languageOptions: {
      globals: {
        ...pluginVitest.environments.env.globals,
      },
    },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      'max-len': 'off',
    },
  },
];
