import { useCallback } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  hydrateSendDraftFromConfirmParams,
  resetSendDraft,
} from '@/hooks/useSendDraft';
import { addRecentSendRecipient } from '@/hooks/useRecentSendRecipients';
import type { IdentityBadgeKind } from '@/lib/identityProtocols';
import type { HomeStackParamList, MainTabParamList } from '@/navigation/types';

export type SendableContact = {
  identityId: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  username?: string | null;
  name?: string | null;
  label?: string | null;
  profilePhotoUrl?: string | null;
  isFarcaster?: boolean;
  isEns?: boolean;
  isBasename?: boolean;
  isLens?: boolean;
  isSns?: boolean;
  isNostr?: boolean;
  identityBadge?: IdentityBadgeKind | null;
};

type SendToContactOptions = {
  tokenId?: string;
  usdAmount?: string;
};

type SendAmountParams = {
  tokenId?: string;
  usdAmount?: string;
};

function resolveIdentityBadge(
  contact: SendableContact,
): IdentityBadgeKind | null {
  if (contact.identityBadge) {
    return contact.identityBadge;
  }
  if (contact.isFarcaster) {
    return 'farcaster';
  }
  if (contact.isEns) {
    return 'ens';
  }
  if (contact.isBasename) {
    return 'basename';
  }
  if (contact.isLens) {
    return 'lens';
  }
  if (contact.isSns) {
    return 'sns';
  }
  if (contact.isNostr) {
    return 'nostr';
  }
  return null;
}

function isHomeStackNavigation(
  navigation: NavigationProp<Record<string, unknown>>,
): navigation is NativeStackNavigationProp<HomeStackParamList> {
  return navigation.getState().routeNames.includes('sendAmount');
}

function openSendAmount(
  navigation: NavigationProp<Record<string, unknown>>,
  params: SendAmountParams,
): void {
  if (isHomeStackNavigation(navigation)) {
    const state = navigation.getState();
    const sendAmountIndex = state.routes.findIndex(
      (route) => route.name === 'sendAmount',
    );

    if (sendAmountIndex >= 0) {
      navigation.reset({
        index: 2,
        routes: [
          { name: 'index' },
          { name: 'send' },
          { name: 'sendAmount', params },
        ],
      });
      return;
    }

    navigation.navigate('sendAmount', params);
    return;
  }

  const tabNavigation =
    navigation.getParent<NavigationProp<MainTabParamList>>() ?? navigation;

  tabNavigation.dispatch(
    CommonActions.navigate({
      name: 'home',
      params: {
        screen: 'sendAmount',
        params,
      },
    }),
  );
}

/**
 * Open Send Amount prefilled for a contact (skips Recipient when details known).
 */
export function useSendToContact() {
  const navigation = useNavigation<NavigationProp<Record<string, unknown>>>();

  const canSendToContact = useCallback((contact: SendableContact | null) => {
    if (!contact) {
      return false;
    }
    return Boolean(
      contact.identityId || contact.evmAddress || contact.solanaAddress,
    );
  }, []);

  const sendToContact = useCallback(
    (contact: SendableContact, options?: SendToContactOptions) => {
      if (
        contact.identityId ||
        contact.evmAddress ||
        contact.solanaAddress
      ) {
        addRecentSendRecipient(contact);
      }

      resetSendDraft();

      const identityBadge = resolveIdentityBadge(contact);
      const displayName =
        contact.name?.trim() ||
        contact.label?.trim() ||
        null;
      const hydrateParams = {
        recipientUsername:
          identityBadge === 'farcaster' ? contact.username ?? null : null,
        recipientName: displayName,
        recipientProfilePhotoUrl: contact.profilePhotoUrl,
        recipientIsFarcaster: contact.isFarcaster,
        recipientIsEns: contact.isEns,
        recipientIdentityBadge: identityBadge,
        usdAmount: options?.usdAmount,
      };

      if (contact.identityId) {
        hydrateSendDraftFromConfirmParams({
          identity: contact.identityId,
          ...hydrateParams,
        });
      } else {
        hydrateSendDraftFromConfirmParams({
          ethereumRecipient: contact.evmAddress ?? undefined,
          solanaRecipient: contact.solanaAddress ?? undefined,
          ...hydrateParams,
        });
      }

      openSendAmount(navigation, {
        tokenId: options?.tokenId,
        usdAmount: options?.usdAmount,
      });
    },
    [navigation],
  );

  return { canSendToContact, sendToContact };
}
