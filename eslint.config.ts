import eslint from "@eslint/js";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.builtin,
    },
    linterOptions: {
      noInlineConfig: true,
    },
    plugins: {
      unicorn,
    },
    extends: ["unicorn/recommended"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "unicorn/prefer-module": "error",
    },
  },
);
