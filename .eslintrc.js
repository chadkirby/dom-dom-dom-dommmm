
module.exports = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint'],
  ignorePatterns: ["dist"],
  rules: {
    'prefer-const': 'off',
  },
  overrides: [

    // javascript
    {
      files: ['**/*.js'],
      plugins: [ 'node', 'no-only-tests' ],
      extends: [
        'eslint:recommended',
        'plugin:prettier/recommended',
        'plugin:node/recommended',
      ],
      rules: {
        "no-shadow": [
          "error",
          {
            builtinGlobals: true,
            hoist: "functions",
            allow: [ "URL", "URLSearchParams", "root", "path" ]
          }
        ],
        "node/no-extraneous-require": [
          "error", {
            "allowModules": ["tape", "tape-promise", "sinon"],
            "resolvePaths": [],
            "tryExtensions": []
          }
        ],
        'node/shebang': 'off'
      },
    },

    // typescript
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    }, {
      files: [ "tests/*.js" ],
      rules: {}
    }

  ]
};
