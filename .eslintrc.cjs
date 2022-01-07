module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  env: {
    es6: true,
  },
  extends: ['plugin:prettier/recommended'],
  plugins: ['no-only-tests'],
  ignorePatterns: ['dist', 'types'],
  overrides: [
    // typescript
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'prefer-const': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    // javascript
    {
      files: ['**/*.js'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      extends: [
        'eslint:recommended',
        'plugin:node/recommended',
        'plugin:import/recommended',
      ],
      rules: {
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-missing-import': 'off',
        'import/no-unresolved': 'off',
        'no-shadow': [
          'error',
          {
            builtinGlobals: true,
            hoist: 'functions',
            allow: ['URL', 'URLSearchParams', 'root', 'path'],
          },
        ],
        'node/shebang': 'off',
      },
    },
    {
      files: ['**/tests/**/*.js'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      rules: {
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-missing-import': 'off',
        'import/no-named-as-default-member': 'off',
        'node/no-extraneous-require': [
          'error',
          {
            allowModules: ['tape', 'tape-promise', 'sinon'],
            resolvePaths: [],
            tryExtensions: [],
          },
        ],
        'node/no-extraneous-import': [
          'error',
          {
            allowModules: ['tape', 'tape-promise', 'sinon', 'shared'],
            resolvePaths: [],
            tryExtensions: [],
          },
        ],
        'no-shadow': [
          'error',
          { builtinGlobals: false, hoist: 'functions', allow: ['require'] },
        ],
      },
    },
  ],
};
