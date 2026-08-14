const expoConfig = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  expoConfig,
  {
    files: ["App.tsx", "index.ts", "polyfills.ts"],
    rules: {
      // Polyfills require side-effect import order; `global.Buffer` between imports.
      "import/first": "off",
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      ".expo/**",
      "convex/_generated/**",
      "dist/**",
      "extension/dist/**",
      "web-build/**",
      "build/**",
      "ios/**",
      "android/**",
      "*.config.js",
    ],
  },
]);
