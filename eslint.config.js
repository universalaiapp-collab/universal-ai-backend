/**
 * eslint.config.js — defensive flat ESLint config (CommonJS)
 * If @typescript-eslint packages are not installed, TypeScript section is skipped.
 */
function tryResolve(name){
  try { return require.resolve(name); } catch (e) { return null; }
}
const tsParser = tryResolve("@typescript-eslint/parser");
const tsPlugin = tryResolve("@typescript-eslint/eslint-plugin");

const config = [
  { ignores: ["src-backup-*", ".env", ".env.bak"] }
];

if (tsParser && tsPlugin) {
  config.push({
    files: ["**/*.ts","**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: { "@typescript-eslint": require(tsPlugin) },
    rules: { ...((() => { try { return require("@typescript-eslint/eslint-plugin").configs?.recommended?.rules || {}; } catch(e) { return {}; } })()) }
  });
} else {
  config.push({
    files: ["**/*.ts","**/*.tsx"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module" },
    rules: {}
  });
  try { console.warn("Warning: @typescript-eslint packages not found. TS rules disabled until installation."); } catch(e){}
}

config.push({
  files: ["**/*.js"],
  languageOptions: { ecmaVersion: 2023, sourceType: "module" },
  rules: {}
});

module.exports = config;