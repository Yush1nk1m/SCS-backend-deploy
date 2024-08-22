module.exports = {
  env: {
      browser: true,
      es2021: true,
      node: true,
  },
  extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended', // Prettier 규칙을 ESLint에 통합
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
      'prettier/prettier': [
          'error',
          {
              tabWidth: 4,
              singleQuote: false,
          },
      ],
      // 추가적인 ESLint 규칙을 여기에 정의할 수 있습니다.
  },
};
