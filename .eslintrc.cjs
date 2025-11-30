module.exports = {
  // classic (non-flat) ESLint config
  
  ignorePatterns: ['src-backup-*', '.env', '.env.bak'],
  env: { node: true, es2023: true },
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  overrides: [
    {
      files: ['**/*.ts','**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {}
    },
    {
      files: ['**/*.js'],
      env: { node: true }
    }
  ]
};
