const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

module.exports = [
  {
    ignores: ["node_modules", ".expo", "dist"],
  },
  ...compat.extends("expo"),
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**", "jest-setup.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        it: "readonly",
        expect: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
];
