import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ContactDetails } from '@/hooks/useContactDetails';
import {
  hydrateSendDraftFromConfirmParams,
  resetSendDraft,
} from '@/hooks/useSendDraft';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Open Send Amount prefilled for a contact (skips Recipient when details known).
 */
export function useSendToContact() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const canSendToContact = useCallback((contact: ContactDetails | null) => {
    if (!contact) {
      return false;
    }
    return Boolean(
      contact.identityId || contact.evmAddress || contact.solanaAddress,
    );
  }, []);

  const sendToContact = useCallback(
    (contact: ContactDetails) => {
      resetSendDraft();

      if (contact.identityId) {
        hydrateSendDraftFromConfirmParams({ identity: contact.identityId });
      } else {
        hydrateSendDraftFromConfirmParams({
          ethereumRecipient: contact.evmAddress ?? undefined,
          solanaRecipient: contact.solanaAddress ?? undefined,
        });
      }

      navigation.navigate('sendAmount');
    },
    [navigation],
  );

  return { canSendToContact, sendToContact };
}
