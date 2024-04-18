// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";

const extraRules = {
  // Warn against template literal placeholder syntax in regular strings
  "no-template-curly-in-string": "warn",

  // Warn if return statements do not either always or never specify values
  "consistent-return": "warn",

  // Warn if no return statements in callbacks of array methods
  "array-callback-return": "warn",

  // Requre the use of === and !==
  eqeqeq: "error",

  // Disallow the use of alert, confirm, and prompt
  "no-alert": "error",

  // Disallow the use of arguments.caller or arguments.callee
  "no-caller": "error",

  // Disallow null comparisons without type-checking operators
  "no-eq-null": "error",

  // Disallow the use of eval()
  "no-eval": "error",

  // Warn against extending native types
  "no-extend-native": "warn",

  // Warn against unnecessary calls to .bind()
  "no-extra-bind": "warn",

  // Warn against unnecessary labels
  "no-extra-label": "warn",

  "no-fallthrough": "warn",
  // Disallow leading or trailing decimal points in numeric literals
  "no-floating-decimal": "error",

  // Warn against shorthand type conversions
  "no-implicit-coercion": "warn",

  // Warn against function declarations and expressions inside loop statements
  "no-loop-func": "warn",

  // Disallow new operators with the Function object
  "no-new-func": "error",

  // Warn against new operators with the String, Number, and Boolean objects
  "no-new-wrappers": "warn",

  // Disallow throwing literals as exceptions
  "no-throw-literal": "error",

  // Require using Error objects as Promise rejection reasons
  "prefer-promise-reject-errors": "error",

  // Enforce “for” loop update clause moving the counter in the right direction
  "for-direction": "error",

  // Enforce return statements in getters
  "getter-return": "error",

  // Disallow await inside of loops
  "no-await-in-loop": "error",

  // Disallow comparing against -0
  "no-compare-neg-zero": "error",

  // Warn against catch clause parameters from shadowing variables in the outer scope
  "no-catch-shadow": "warn",

  // Disallow identifiers from shadowing restricted names
  "no-shadow-restricted-names": "error",

  // Enforce return statements in callbacks of array methods
  "callback-return": "error",

  // Require error handling in callbacks
  "handle-callback-err": "error",

  // Warn against string concatenation with __dirname and __filename
  "no-path-concat": "warn",

  // Prefer using arrow functions for callbacks
  "prefer-arrow-callback": "warn",

  // Return inside each then() to create readable and reusable Promise chains.
  // "promise/always-return": "error",

  //Enforces the use of catch() on un-returned promises
  // "promise/catch-or-return": "error",

  // Warn against nested then() or catch() statements
  // "promise/no-nesting": "warn",
};

const unUsedVarsIgnore = {
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
};

export default tseslint.config(
  eslint.configs.all,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,

  {
    ignores: [".*", "node_modules/", "dist/", "test/"],
  },
  {
    languageOptions: {
      parser: tsParser,

      parserOptions: {
        project: "./tsconfig.json",
        // sourceType: "module",
        // ecmaVersion: "latest",
      },
      sourceType: "module",
      // globals: { ...globals.browser },
    },
    plugins: {},
    settings: {},
    rules: {
      ...extraRules,
      ...unUsedVarsIgnore,

      // turn back on later
      "sort-imports": "off",
      "no-magic-numbers": "off",
      curly: "off",
      "one-var": "off",
      "multiline-comment-style": "off",

      "no-console": "warn",

      // too strict
      "sort-keys": "off",
      "func-style": "off",
      "id-length": "off",
      "capitalized-comments": "off",
      "max-statements": "off",
      "no-ternary": "off",
      "line-comment-position": "off",
      "no-negated-condition": "off",

      // disable unsafe autofixing '?' optional chaining
      "@typescript-eslint/no-unnecessary-condition": "off",

      "@typescript-eslint/no-floating-promises": "warn",
    },
    linterOptions: {
      // report when eslint-disable-next-line is unnecessary
      reportUnusedDisableDirectives: true,
    },
  },
  {
    // everything gets prettier
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierPlugin.configs.recommended.rules,
      "prettier/prettier": ["warn", { trailingComma: "es5" }],
    },
  }
);
