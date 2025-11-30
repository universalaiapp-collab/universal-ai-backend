module.exports = [
  {
    files: ['**/*.ts','**/*.js'],
    languageOptions: { ecmaVersion: 2020, sourceType: 'module' },
    rules: { 'no-unused-vars': 'warn' }
  }
];

// added by cleanup script
module.exports = Object.assign(module.exports || {}, { ignores: (module.exports && module.exports.ignores) ? module.exports.ignores.concat(['src-backup-*', '.env', '.env.bak']) : ['src-backup-*', '.env', '.env.bak'] });

