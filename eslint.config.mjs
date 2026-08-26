import tseslint from "typescript-eslint";

// Existing files contain scoped react-hooks suppression comments. The newest
// plugin currently cannot load in this dependency graph because it imports a
// zod-validation-error subpath that is not exported here. Register a no-op
// compatibility rule so those comments remain valid without making lint
// startup depend on the incompatible plugin.
const reactHooksCompatibilityPlugin = {
  rules: {
    "exhaustive-deps": {
      meta: {
        type: "problem",
        docs: { description: "Compatibility placeholder for legacy directives" },
        schema: [],
      },
      create: () => ({}),
    },
  },
};

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooksCompatibilityPlugin,
    },
    rules: {
      "no-debugger": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      // The repository contains many intentional split imports from legacy
      // modules. Keep this baseline focused on runtime correctness.
      "no-duplicate-imports": "off",
      "no-irregular-whitespace": "error",
      "no-unreachable": "error",
      // These rules are registered so existing file-local directives remain
      // valid, while their migration is deliberately outside this gate.
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
    },
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
];