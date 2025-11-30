/**
 * eslint.config.js — defensive flat ESLint config (CommonJS)
 * If @typescript-eslint packages are not installed, the TypeScript section is skipped
 * so ESLint won't crash during require().
 */
const fs = require('fs');
const path = require('path');

function tryResolve(name) {
  try {
    return require.resolve(name);
  } catch (e) {
    return null;
  }
}

const tsParserPath = tryResolve("@typescript-eslint/parser");
const tsPluginPath = tryResolve("@typescript-eslint/eslint-plugin");

const config = [
  // global ignores replacement for ignorePatterns
  { ignores: ["src-backup-*", ".env", ".env.bak"] }
];

if (tsParserPath && tsPluginPath) {
  // Both parser + plugin are available => enable TS rules
  config.push({
    files: ["**/*.ts","**/*.tsx"],
    languageOptions: {
      parser: tsParserPath,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": require(tsPluginPath)
    },
    rules: {
      // spread recommended if exposed (safe)
      ...((() => {
        try {
          return require("@typescript-eslint/eslint-plugin").configs?.recommended?.rules || {};
        } catch (e) {
          return {};
        }
      })())
    }
  });
} else {
  // If missing, add a minimal TS-friendly fallback (no parser/plugin) and warn
  config.push({
    files: ["**/*.ts","**/*.tsx"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module" },
    rules: {}
  });
  // Print a helpful message when ESLint runs and loads this config
  try {
    // console.warn will be visible when config is required
    console.warn("Warning: @typescript-eslint/parser or plugin not found. TypeScript-specific rules are disabled until you install them.");
  } catch (e) {}
}

// Plain JS files
config.push({
  files: ["**/*.js"],
  languageOptions: { ecmaVersion: 2023, sourceType: "module" },
  rules: {}
});

module.exports = config;