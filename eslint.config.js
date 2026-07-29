const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

module.exports = [
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "*.json",
      "*.txt",
      "*.py",
      "coverage/**",
    ],
  },
  ...compat.extends("expo"),
  {
    files: ["scripts/**/*.js", "*.config.js", "*.config.ts", "jest-setup.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
      },
    },
  },
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
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-redeclare": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
