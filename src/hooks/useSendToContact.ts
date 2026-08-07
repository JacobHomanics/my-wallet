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
 * Open Send prefilled for a contact (account number and/or chain addresses).
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
        navigation.navigate('send', { identity: contact.identityId });
        return;
      }

      const ethereumRecipient = contact.evmAddress ?? undefined;
      const solanaRecipient = contact.solanaAddress ?? undefined;
      hydrateSendDraftFromConfirmParams({
        ethereumRecipient,
        solanaRecipient,
      });
      navigation.navigate('send', {
        ethereumRecipient,
        solanaRecipient,
      });
    },
    [navigation],
  );

  return { canSendToContact, sendToContact };
}
