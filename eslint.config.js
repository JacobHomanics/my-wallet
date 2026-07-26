const expoConfig = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  expoConfig,
  {
    files: ["App.tsx"],
    rules: {
      // Polyfills require `global.Buffer = Buffer` between side-effect imports; order matters at runtime.
      "import/first": "off",
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      ".expo/**",
      "convex/_generated/**",
      "dist/**",
      "build/**",
      "ios/**",
      "android/**",
      "*.config.js",
    ],
  },
]);
