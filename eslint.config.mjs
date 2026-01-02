import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/__tests__/**", "**/coverage/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      // Disable React JSX scope requirement for Next.js
      "react/react-in-jsx-scope": "off",
      // Disable prop-types for TypeScript projects
      "react/prop-types": "off",
      // Allow unused variables that start with underscore
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      // Allow any types for now (can be made stricter later)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require() imports
      "@typescript-eslint/no-require-imports": "off",
      // Allow @ts-ignore comments
      "@typescript-eslint/ban-ts-comment": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
