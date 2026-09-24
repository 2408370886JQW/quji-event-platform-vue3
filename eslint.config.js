import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import vueParser from 'vue-eslint-parser'

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'src/components.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      globals: {
        Event: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  {
    files: ['src/**/*.test.ts'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
  {
    files: ['cypress/**/*.ts', 'cypress.config.ts'],
    languageOptions: {
      globals: {
        beforeEach: 'readonly',
        Cypress: 'readonly',
        cy: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
      },
    },
  },
  prettier,
)
