import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{js,ts}'],
  },
  {
    ignores: ['dist/', 'meshwalk.module.min.js', 'vite.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  },
];
