import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getSendDraftSnapshot } from '@/hooks/useSendDraft';

type SyncSendRecipientFromDraftArgs = {
  setAccountNumber: (value: string) => void;
  setEthereumRecipient: (value: string) => void;
  setSolanaRecipient: (value: string) => void;
  setShowDecodedAddresses: (value: boolean) => void;
};

/**
 * Keeps recipient form fields in sync with the send draft when the screen focuses.
 */
export function useSyncSendRecipientFromDraft({
  setAccountNumber,
  setEthereumRecipient,
  setSolanaRecipient,
  setShowDecodedAddresses,
}: SyncSendRecipientFromDraftArgs) {
  useFocusEffect(
    useCallback(() => {
      const draft = getSendDraftSnapshot();
      setAccountNumber(draft.accountNumber);
      setEthereumRecipient(draft.ethereumRecipient);
      setSolanaRecipient(draft.solanaRecipient);

      if (
        !draft.accountNumber.trim() &&
        !draft.ethereumRecipient.trim() &&
        !draft.solanaRecipient.trim()
      ) {
        setShowDecodedAddresses(false);
      }
    }, [
      setAccountNumber,
      setEthereumRecipient,
      setSolanaRecipient,
      setShowDecodedAddresses,
    ]),
  );
}
