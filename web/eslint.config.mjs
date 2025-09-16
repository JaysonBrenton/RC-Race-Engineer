/**
 * RC Race Engineer
 * File: eslint.config.mjs
 * Author: Jayson + The Brainy One
 * Created: 2025-09-16
 * Purpose: ESLint flat config for TypeScript/Next.js repo with headers & import order.
 * License: MIT
 */
import js from '@eslint/js';
import * as tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import header from 'eslint-plugin-header';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin, header },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
      'header/header': [
        'error',
        'block',
        [
          ' * RC Race Engineer',
          ' * File: <FILENAME>',
          ' * Author: Jayson + The Brainy One',
          ' * Created: <DATE>',
          ' * Purpose: <PURPOSE>',
          ' * License: MIT'
        ],
        2
      ]
    }
  },
  { ignores: ['node_modules/', '.next/', 'dist/', 'build/', '.husky/'] }
);
