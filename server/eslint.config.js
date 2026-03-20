import prettierPlugin from "eslint-plugin-prettier";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

/** @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray} */
export default [
  {
    ignores: ["dist/**", "node_modules/**", "eslint.config.js"],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      prettier: prettierPlugin,
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json", "./tsconfig.scripts.json"],
        tsconfigRootDir: process.cwd(),
      },
    },
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-use-before-define": "error",
      "no-var": "warn",
      "no-multi-spaces": "error",
      "space-in-parens": "error",
      "no-multiple-empty-lines": "error",
      "prefer-const": "error",
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "func-names": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-duplicates": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
    },
  },

  {
    files: ["commitlint.config.ts"],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
];
