import type { LinkingOptions, NavigationState, PartialState } from '@react-navigation/native';
import { getStateFromPath as getStateFromPathDefault } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import type { RootStackParamList, HomeStackParamList } from '@/navigation/types';

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

type NavState = PartialState<NavigationState>;

const HOME_STACK_HISTORY: Partial<Record<keyof HomeStackParamList, string[]>> =
  {
    send: ['index'],
    confirmSend: ['index', 'send'],
  };

function ensureHomeStackHistory(state: NavState): NavState {
  const routes = state.routes ?? [];
  if (!routes.length) {
    return state;
  }

  const currentIndex = state.index ?? routes.length - 1;
  const currentRoute = routes[currentIndex];
  if (!currentRoute?.name) {
    return state;
  }

  const requiredPrefix = HOME_STACK_HISTORY[currentRoute.name as keyof HomeStackParamList];
  if (!requiredPrefix?.length) {
    return state;
  }

  const existingByName = new Map(
    routes.map((route) => [route.name, route] as const),
  );
  const ordered = [
    ...requiredPrefix.map((name) => existingByName.get(name) ?? { name }),
    ...routes.filter((route) => !requiredPrefix.includes(route.name)),
  ];

  const newIndex = ordered.findIndex((route) => route === currentRoute);
  return {
    ...state,
    routes: ordered,
    index: newIndex >= 0 ? newIndex : ordered.length - 1,
  };
}

/** Deep links into /send omit ancestor screens; prepend them for pop animations. */
function ensureHomeStackDeepLinkHistory(
  state: NavState | undefined,
): NavState | undefined {
  if (!state?.routes?.length) {
    return state;
  }

  return {
    ...state,
    routes: state.routes.map((route) => {
      if (!route.state) {
        return route;
      }

      if (route.name === 'home') {
        return {
          ...route,
          state: ensureHomeStackHistory(route.state),
        };
      }

      return {
        ...route,
        state: ensureHomeStackDeepLinkHistory(route.state) ?? route.state,
      };
    }),
  };
}

export const rootLinking: LinkingOptions<RootStackParamList> = {
  prefixes: getLinkingPrefixes(),
  getStateFromPath(path, options) {
    const state = getStateFromPathDefault(path, options);
    return ensureHomeStackDeepLinkHistory(state);
  },
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
              send: {
                path: '/send',
                parse: {
                  tokenId: (tokenId: string) => tokenId,
                },
              },
              confirmSend: {
                path: '/send/confirm',
                parse: {
                  usdAmount: (usdAmount: string) => usdAmount,
                  ethereumRecipient: (value: string) => value || undefined,
                  solanaRecipient: (value: string) => value || undefined,
                  legs: (legs: string) => {
                    try {
                      return JSON.parse(legs) as unknown;
                    } catch {
                      return [];
                    }
                  },
                },
                stringify: {
                  legs: (legs: unknown) => JSON.stringify(legs ?? []),
                },
              },
              sent: {
                path: '/send/sent',
                parse: {
                  usdLabel: (usdLabel: string) => usdLabel,
                  legs: (legs: string) => {
                    try {
                      return JSON.parse(legs) as unknown;
                    } catch {
                      return [];
                    }
                  },
                },
                stringify: {
                  legs: (legs: unknown) => JSON.stringify(legs ?? []),
                },
              },
            },
          },
          settings: 'settings',
        },
      },
    },
  },
};
