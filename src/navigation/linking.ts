import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import type { RootStackParamList } from '@/navigation/types';

/** Custom URL scheme registered in app.json / Info.plist (Privy OAuth redirects). */
export const APP_SCHEME = 'mywallet';

/** Production web origin for share / absolute links on native builds. */
export const APP_ORIGIN =
  process.env.EXPO_PUBLIC_APP_ORIGIN?.replace(/\/$/, '') ?? '';

export function getLinkingPrefixes(): string[] {
  const prefixes = [Linking.createURL('/'), `${APP_SCHEME}://`];

  if (APP_ORIGIN) {
    prefixes.push(APP_ORIGIN);
  }

  return prefixes;
}

export function getAppOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return APP_ORIGIN || Linking.createURL('/');
}

export function createAppURL(
  path = '',
  queryParams?: Record<string, string | undefined>,
): string {
  const normalizedPath = path.replace(/^\//, '');
  return Linking.createURL(normalizedPath, {
    scheme: APP_SCHEME,
    queryParams,
  });
}

export function parseAppURL(url: string) {
  return Linking.parse(url);
}

export const rootLinking: LinkingOptions<RootStackParamList> = {
  prefixes: getLinkingPrefixes(),
  config: {
    screens: {
      splash: {
        path: 'splash',
        alias: [
          {
            path: '',
            exact: true,
          },
        ],
      },
      welcome: 'welcome',
      login: 'login',
      loginVerify: 'login/verify',
      main: {
        screens: {
          home: {
            screens: {
              index: 'home',
              // Absolute so it stays /tokens (not /home/tokens) without
              // stealing splash's empty-path alias.
              tokenDetails: '/tokens',
            },
          },
          settings: 'settings',
        },
      },
    },
  },
};
