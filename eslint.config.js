import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{js,ts}'],
  },
  {
    ignores: ['dist', 'vite.config.js', 'examples'],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
