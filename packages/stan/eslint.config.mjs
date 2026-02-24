// @ts-check
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import * as importPlugin from 'eslint-plugin-import';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  { ignores: ['node_modules/*', 'dist/**', '*.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // @ts-expect-error
  importPlugin.flatConfigs.recommended,
  // @ts-expect-error
  importPlugin.flatConfigs.typescript,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooksPlugin.configs['recommended-latest'],
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['src/**/*.tsx'],
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      quotes: 'off',
    },
  },
);
