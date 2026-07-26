type EnvKey =
  | 'EXPO_PUBLIC_PRIVY_WEB_CLIENT_ID'
  | 'EXPO_PUBLIC_PRIVY_MOBILE_CLIENT_ID';

function getRequiredEnv(key: EnvKey): string {
  const value = (() => {
    switch (key) {
      case 'EXPO_PUBLIC_PRIVY_WEB_CLIENT_ID':
        return process.env.EXPO_PUBLIC_PRIVY_WEB_CLIENT_ID;
      case 'EXPO_PUBLIC_PRIVY_MOBILE_CLIENT_ID':
        return process.env.EXPO_PUBLIC_PRIVY_MOBILE_CLIENT_ID;
      default:
        return undefined;
    }
  })();

  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
}

export function createPrivyCredentials(clientIdKey: EnvKey) {
  return {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID || '',
    clientId: getRequiredEnv(clientIdKey),
  };
}
