// @ts-check

import fs from "node:fs";
import path from "node:path";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettier from "prettier";

const ENABLE_PRETTIER = true;

/**
 * Temporarily ignore these
 * @type {import("typescript-eslint").FlatConfig.Rules}
 */
const temporaryRules = {
  // turn back on later
  "sort-imports": "off",
  "no-magic-numbers": "off",
  curly: "off",
  "one-var": "off",
  "multiline-comment-style": "off",
};

/**
 * Ignore these, they're too strict
 * @type {import("typescript-eslint").FlatConfig.Rules}
 */
const tooStrict = {
  "sort-keys": "off",
  "func-style": "off",
  "id-length": "off",
  "capitalized-comments": "off",
  "no-inline-comments": "off",
  "max-statements": "off",
  "max-params": "off",
  "max-lines": "off",
  "max-lines-per-function": "off",
  "no-ternary": "off",
  "line-comment-position": "off",
  "no-negated-condition": "off",
  "no-undefined": "off",
  "func-names": "off",
};

/**
 * Warn these, don't show as error
 * @type {import("typescript-eslint").FlatConfig.Rules}
 */
const commonWarnings = {
  "@typescript-eslint/no-unsafe-argument": "warn", // typescript unknown
  "@typescript-eslint/no-floating-promises": "warn",

  // prevent nullish/zero/NaN cases in if()
  "@typescript-eslint/strict-boolean-expressions": "warn",

  "no-warning-comments": "warn",
  camelcase: "warn",
  "max-depth": "warn",
  "no-console": "warn",
  "max-classes-per-file": "warn",
};

/**
 * @type {import("typescript-eslint").FlatConfig.Rules}
 */
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

/**
 * @type {import("typescript-eslint").FlatConfig.Rules}
 */
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

export default defineConfig(
  {
    ignores: [".*", "node_modules/", "dist/"],
  },

  js.configs.all,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,

  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...extraRules,
      ...unUsedVarsIgnore,

      ...temporaryRules,
      ...tooStrict,
      ...commonWarnings,

      // disable unsafe autofixing '?' optional chaining
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
    linterOptions: {
      // report when eslint-disable-next-line is unnecessary
      reportUnusedDisableDirectives: true,
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  ...(ENABLE_PRETTIER
    ? [
        {
          // everything gets prettier
          plugins: {
            prettier: prettierPlugin,
          },
          rules: {
            ...prettierPlugin.configs?.recommended.rules,
            "prettier/prettier": ["warn", { trailingComma: "es5" }],
          },
        },
        {
          // json gets prettier
          files: ["**/*.{json,css}"],
          extends: [tseslint.configs.disableTypeChecked],

          languageOptions: {
            parser: {
              parse: (
                /** @type {string} */ text,
                /** @type {{filePath:string}} */ info,
              ) => {
                // When file is Json send it to prettier for formatting

                // console.log(JSON.stringify(info))

                prettier
                  .format(text, { filepath: info.filePath })
                  .then((pretty) =>
                    fs.createWriteStream(info.filePath).end(pretty),
                  );

                const name = path.basename(info.filePath);
                console.log(
                  info.filePath,
                  "\n   \x1b[1m\x1b[32mprettier:\x1b[0m",
                  name,
                );
                // throw new Error("Sent to Prettier -> *." + fileExt);
                // node_modules/eslint/lib/source-code/source-code.jsL326
                return {
                  type: "Program",
                  body: [],
                  tokens: [],
                  comments: [],
                  loc: [],
                  range: {},
                  scopes: [],
                };
              },
            },
          },
        },
      ]
    : []),
);
