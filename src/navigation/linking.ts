import type { LinkingOptions, NavigationState, PartialState } from '@react-navigation/native';
import { getStateFromPath as getStateFromPathDefault } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { hydrateSendDraftFromConfirmParams } from '@/hooks/useSendDraft';
import type {
  RootStackParamList,
  HomeStackParamList,
  ContactsStackParamList,
  ProfileStackParamList,
} from '@/navigation/types';

/** Custom URL scheme registered in app.json / Info.plist (Privy OAuth redirects). */
export const APP_SCHEME = 'ziti';

/**
 * Public https origin for QR / share links (and native deep-link prefixes).
 * Must be set in production builds — otherwise local `window.location` /
 * Expo `createURL` yield localhost URLs that phones cannot open.
 */
export const APP_ORIGIN =
  process.env.EXPO_PUBLIC_APP_ORIGIN?.replace(/\/$/, '') ?? '';

export function getLinkingPrefixes(): string[] {
  const prefixes = [Linking.createURL('/'), `${APP_SCHEME}://`];

  if (APP_ORIGIN) {
    prefixes.push(APP_ORIGIN);
  }

  return prefixes;
}

/** In-app origin (current web host, else configured public origin). */
export function getAppOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return APP_ORIGIN || Linking.createURL('/');
}

/**
 * Origin baked into QR codes and copy-link. Prefers EXPO_PUBLIC_APP_ORIGIN so
 * links stay on the public host even when the app is running on localhost.
 */
export function getShareableAppOrigin(): string {
  if (APP_ORIGIN.startsWith('http://') || APP_ORIGIN.startsWith('https://')) {
    return APP_ORIGIN;
  }

  return getAppOrigin();
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

/** Prefer https share links when an origin is known so phone cameras can open them. */
export function createShareableAppURL(
  path = '',
  queryParams?: Record<string, string | undefined>,
): string {
  const origin = getShareableAppOrigin();
  if (origin.startsWith('http://') || origin.startsWith('https://')) {
    const normalizedPath = path.replace(/^\//, '');
    const url = new URL(normalizedPath, `${origin.replace(/\/$/, '')}/`);
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value != null && value !== '') {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  return createAppURL(path, queryParams);
}

export function parseAppURL(url: string) {
  return Linking.parse(url);
}

type NavState = PartialState<NavigationState>;

const HOME_STACK_HISTORY: Partial<Record<keyof HomeStackParamList, string[]>> =
  {
    tokenDetails: ['index'],
    transactions: ['index'],
    receive: ['index'],
    request: ['index'],
    stripeOnramp: ['index'],
    stripeOnrampComponents: ['index'],
    receiveQr: ['index', 'request'],
    send: ['index'],
    sendSearch: ['index', 'send'],
    sendAdvancedSearch: ['index', 'send', 'sendSearch'],
    sendAmount: ['index', 'send'],
    confirmSend: ['index', 'send', 'sendAmount'],
  };

const CONTACTS_STACK_HISTORY: Partial<
  Record<keyof ContactsStackParamList, string[]>
> = {
  newContact: ['index'],
  newFarcasterContact: ['index', 'newContact'],
  newEnsContact: ['index', 'newContact'],
  newBasenameContact: ['index', 'newContact'],
  newLensContact: ['index', 'newContact'],
  newSnsContact: ['index', 'newContact'],
  newNostrContact: ['index', 'newContact'],
  newRawAddressContact: ['index', 'newContact'],
  contactDetails: ['index'],
};

const PROFILE_STACK_HISTORY: Partial<
  Record<keyof ProfileStackParamList, string[]>
> = {
  settings: ['index'],
  profileSettings: ['index', 'settings'],
  moneySettings: ['index', 'settings'],
  onrampSettings: ['index', 'settings', 'moneySettings'],
  sendSettings: ['index', 'settings', 'moneySettings'],
  earnSettings: ['index', 'settings', 'moneySettings'],
};

function hydrateSendDraftFromNavState(state: NavState | undefined): void {
  if (!state?.routes?.length) {
    return;
  }

  for (const route of state.routes) {
    if (
      (route.name === 'confirmSend' ||
        route.name === 'send' ||
        route.name === 'sendAmount') &&
      route.params
    ) {
      const params = route.params as {
        usdAmount?: string;
        identity?: string;
        ethereumRecipient?: string;
        solanaRecipient?: string;
      };
      if (
        params.identity ||
        params.ethereumRecipient ||
        params.solanaRecipient ||
        params.usdAmount
      ) {
        hydrateSendDraftFromConfirmParams(params);
      }
    }

    if (route.state) {
      hydrateSendDraftFromNavState(route.state);
    }
  }
}

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

function ensureContactsStackHistory(state: NavState): NavState {
  const routes = state.routes ?? [];
  if (!routes.length) {
    return state;
  }

  const currentIndex = state.index ?? routes.length - 1;
  const currentRoute = routes[currentIndex];
  if (!currentRoute?.name) {
    return state;
  }

  const requiredPrefix =
    CONTACTS_STACK_HISTORY[
      currentRoute.name as keyof ContactsStackParamList
    ];
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

function ensureProfileStackHistory(state: NavState): NavState {
  const routes = state.routes ?? [];
  if (!routes.length) {
    return state;
  }

  const currentIndex = state.index ?? routes.length - 1;
  const currentRoute = routes[currentIndex];
  if (!currentRoute?.name) {
    return state;
  }

  const requiredPrefix =
    PROFILE_STACK_HISTORY[currentRoute.name as keyof ProfileStackParamList];
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

/** Deep links into nested stacks omit ancestor screens; prepend them for pop animations. */
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

      if (route.name === 'contacts') {
        return {
          ...route,
          state: ensureContactsStackHistory(route.state),
        };
      }

      if (route.name === 'profile') {
        return {
          ...route,
          state: ensureProfileStackHistory(route.state),
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
    hydrateSendDraftFromNavState(state);
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
      login: {
        path: 'login',
        parse: {
          returnTo: (value: string) => value || undefined,
          address: (value: string) => value || undefined,
          chain: (value: string) => value || undefined,
        },
      },
      loginVerify: {
        path: 'login/verify',
        parse: {
          method: (value: string) => value,
          value: (value: string) => value,
          returnTo: (value: string) => value || undefined,
          address: (value: string) => value || undefined,
          chain: (value: string) => value || undefined,
        },
      },
      exportWallet: {
        path: 'export',
        parse: {
          address: (address: string) => address,
          chain: (chain: string) => chain as 'ethereum' | 'solana',
        },
      },
      onboarding: 'onboarding',
      config: 'config',
      main: {
        screens: {
          home: {
            screens: {
              index: 'home',
              // Absolute so it stays /tokens (not /home/tokens) without
              // stealing splash's empty-path alias.
              tokenDetails: '/tokens',
              transactions: '/transactions',
              receive: '/receive',
              request: '/request',
              stripeOnramp: '/deposit',
              stripeOnrampComponents: '/deposit/components',
              receiveQr: {
                path: '/receive/qr',
                parse: {
                  usdAmount: (usdAmount: string) => usdAmount,
                },
              },
              send: {
                path: '/send',
                parse: {
                  tokenId: (tokenId: string) => tokenId || undefined,
                  usdAmount: (usdAmount: string) => usdAmount || undefined,
                  identity: (value: string) => value || undefined,
                  ethereumRecipient: (value: string) => value || undefined,
                  solanaRecipient: (value: string) => value || undefined,
                },
              },
              sendSearch: {
                path: '/send/search',
                parse: {
                  tokenId: (tokenId: string) => tokenId || undefined,
                  usdAmount: (usdAmount: string) => usdAmount || undefined,
                },
              },
              sendAdvancedSearch: {
                path: '/send/advanced-search',
                parse: {
                  tokenId: (tokenId: string) => tokenId || undefined,
                  usdAmount: (usdAmount: string) => usdAmount || undefined,
                },
              },
              sendAmount: {
                path: '/send/amount',
                parse: {
                  tokenId: (tokenId: string) => tokenId || undefined,
                  usdAmount: (usdAmount: string) => usdAmount || undefined,
                },
              },
              confirmSend: {
                path: '/send/confirm',
                parse: {
                  usdAmount: (usdAmount: string) => usdAmount || undefined,
                  identity: (value: string) => value || undefined,
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
          contacts: {
            path: 'contacts',
            screens: {
              index: '',
              newContact: 'new',
              newFarcasterContact: 'new/farcaster',
              newEnsContact: 'new/ens',
              newBasenameContact: 'new/basename',
              newLensContact: 'new/lens',
              newSnsContact: 'new/sns',
              newNostrContact: 'new/nostr',
              newRawAddressContact: 'new/addresses',
              contactDetails: {
                path: ':contactId',
                parse: {
                  contactId: (contactId: string) => contactId,
                },
              },
            },
          },
          rewards: {
            path: 'rewards',
            screens: {
              index: '',
            },
          },
          earn: {
            path: 'earn',
            screens: {
              index: '',
            },
          },
          profile: {
            path: 'profile',
            screens: {
              index: '',
              settings: 'settings',
              profileSettings: 'settings/profile',
              moneySettings: 'settings/money',
              onrampSettings: 'settings/onramp',
              sendSettings: 'settings/send',
              earnSettings: 'settings/earn',
            },
          },
        },
      },
    },
  },
};
