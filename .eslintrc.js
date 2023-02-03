module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended',
    'standard',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'prefer-template': 'error',
    'no-restricted-globals': [
      'error',
      'name', 'status', 'origin',
    ],
    'comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': ['error', { types: { Function: false, '{}': false }, extendDefaults: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_(\\d+)?$' }],
    '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
    '@typescript-eslint/type-annotation-spacing': ['error', {
      before: true,
      after: true,
      overrides: { colon: { before: false, after: true } },
    }],
  },
  overrides: [{ files: ['*.js', '*.ts', '*.tsx'] }],
  root: true,
}
