import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  hydrateSendDraftFromConfirmParams,
  resetSendDraft,
} from '@/hooks/useSendDraft';
import type { HomeStackParamList } from '@/navigation/types';

export type SendableContact = {
  identityId: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  username?: string | null;
  name?: string | null;
  profilePhotoUrl?: string | null;
};

type SendToContactOptions = {
  tokenId?: string;
  usdAmount?: string;
};

/**
 * Open Send Amount prefilled for a contact (skips Recipient when details known).
 */
export function useSendToContact() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

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
          usdAmount: options?.usdAmount,
        });
      } else {
        hydrateSendDraftFromConfirmParams({
          ethereumRecipient: contact.evmAddress ?? undefined,
          solanaRecipient: contact.solanaAddress ?? undefined,
          recipientUsername: contact.username,
          recipientName: contact.name,
          recipientProfilePhotoUrl: contact.profilePhotoUrl,
          usdAmount: options?.usdAmount,
        });
      }

      navigation.navigate('sendAmount', {
        tokenId: options?.tokenId,
        usdAmount: options?.usdAmount,
      });
    },
    [navigation],
  );

  return { canSendToContact, sendToContact };
}
