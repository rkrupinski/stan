// @ts-check
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import * as importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  { ignores: ['dist', '*.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // @ts-expect-error
  importPlugin.flatConfigs.recommended,
  // @ts-expect-error
  importPlugin.flatConfigs.typescript,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          conditionNames: ['import', 'require', 'default'],
        },
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports' },
      ],
    },
  },
);
