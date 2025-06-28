module.exports = {
  env: {
    browser: true,
    es2021: true,
    serviceworker: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error'
  },
  globals: {
    'L': 'readonly',
    'Swal': 'readonly',
    '__IS_PRODUCTION__': 'readonly',
    '__IS_DEVELOPMENT__': 'readonly',
    '__BASE_PATH__': 'readonly',
    '__BUILD_TIMESTAMP__': 'readonly',
    '__VERSION__': 'readonly'
  }
};