import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{js,ts}'],
  },
  {
    ignores: ['dist/', 'vite.config.js'],
  },
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
