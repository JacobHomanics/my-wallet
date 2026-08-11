import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import {
  hydrateSendDraftFromConfirmParams,
  resetSendDraft,
} from '@/hooks/useSendDraft';
import type { MainTabParamList } from '@/navigation/types';

export type SendableContact = {
  identityId: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  username?: string | null;
  name?: string | null;
  profilePhotoUrl?: string | null;
  isFarcaster?: boolean;
  isEns?: boolean;
};

type SendToContactOptions = {
  tokenId?: string;
  usdAmount?: string;
};

/**
 * Open Send Amount prefilled for a contact (skips Recipient when details known).
 */
export function useSendToContact() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

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
      resetSendDraft();

      if (contact.identityId) {
        hydrateSendDraftFromConfirmParams({
          identity: contact.identityId,
          recipientUsername: contact.username,
          recipientName: contact.name,
          recipientProfilePhotoUrl: contact.profilePhotoUrl,
          recipientIsFarcaster: contact.isFarcaster,
          recipientIsEns: contact.isEns,
          usdAmount: options?.usdAmount,
        });
      } else {
        hydrateSendDraftFromConfirmParams({
          ethereumRecipient: contact.evmAddress ?? undefined,
          solanaRecipient: contact.solanaAddress ?? undefined,
          recipientUsername: contact.username,
          recipientName: contact.name,
          recipientProfilePhotoUrl: contact.profilePhotoUrl,
          recipientIsFarcaster: contact.isFarcaster,
          recipientIsEns: contact.isEns,
          usdAmount: options?.usdAmount,
        });
      }

      navigation.navigate('home', {
        screen: 'sendAmount',
        params: {
          tokenId: options?.tokenId,
          usdAmount: options?.usdAmount,
        },
      });
    },
    [navigation],
  );

  return { canSendToContact, sendToContact };
}
