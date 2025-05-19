// @ts-check
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import jestPlugin from 'eslint-plugin-jest';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import * as importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default defineConfig([
  globalIgnores(['node_modules/*', 'dist/**', '*.mjs']),
  importPlugin.flatConfigs?.recommended,
  importPlugin.flatConfigs?.typescript,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooksPlugin.configs['recommended-latest'],
  ...compat.plugins('@typescript-eslint'),
  ...compat.extends('plugin:@typescript-eslint/recommended-type-checked'),
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
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
]);
