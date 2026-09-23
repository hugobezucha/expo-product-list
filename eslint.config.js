const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // legacy.tsx is the refactoring input, kept as is
    ignores: ['dist/*', 'src/refactoring/legacy.tsx'],
  },
]);
