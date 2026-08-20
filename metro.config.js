const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

function resolvePrivyEntry(subpath) {
  const moduleName = subpath
    ? `@privy-io/react-auth/${subpath}`
    : "@privy-io/react-auth";
  return require.resolve(moduleName);
}

function resolvePrivyPackageRoot() {
  // Package does not export ./package.json; derive root from the CJS entry.
  return path.resolve(path.dirname(resolvePrivyEntry()), "../..");
}

// styled-components/native requires this optional peer; pnpm can leave it
// invisible to Metro's nested resolution — force the app-root install.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "css-to-react-native": path.dirname(
    require.resolve("css-to-react-native/package.json"),
  ),
  "@privy-io/react-auth": resolvePrivyPackageRoot(),
};

const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  // Note: do not shim `react-native` with Object.assign on RN 0.86+ —
  // public API uses getters and a copied object drops StyleSheet/etc.

  if (platform === "web" && moduleName === "@privy-io/react-auth") {
    return context.resolveRequest(context, resolvePrivyEntry(), platform);
  }

  if (platform === "web" && moduleName === "@privy-io/react-auth/ui") {
    return context.resolveRequest(context, resolvePrivyEntry("ui"), platform);
  }

  if (platform === "web" && moduleName === "@privy-io/react-auth/solana") {
    return context.resolveRequest(context, resolvePrivyEntry("solana"), platform);
  }

  if (moduleName === "isows") {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (moduleName.startsWith("zustand")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (moduleName === "valtio" || moduleName.startsWith("valtio/")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: platform === "web" ? false : true,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (moduleName === "jose") {
    const ctx = {
      ...context,
      unstable_conditionNames: ["browser"],
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (moduleName.startsWith("@privy-io/")) {
    const ctx = {
      ...context,
      // On web, prefer CJS entrypoints to avoid ESM-only syntax edge cases.
      unstable_enablePackageExports: platform === "web" ? false : true,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolveRequest = resolveRequestWithPackageExports;

// Match frontend web bundling behavior for Privy.
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false
    },
  }),
};

module.exports = config;
