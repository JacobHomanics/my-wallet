import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getSendDraftSnapshot } from '@/hooks/useSendDraft';

type SyncSendRecipientFromDraftArgs = {
  setAccountNumber: (value: string) => void;
  setEthereumRecipient: (value: string) => void;
  setSolanaRecipient: (value: string) => void;
};

/**
 * Keeps recipient form fields in sync with the send draft when the screen focuses.
 */
export function useSyncSendRecipientFromDraft({
  setAccountNumber,
  setEthereumRecipient,
  setSolanaRecipient,
}: SyncSendRecipientFromDraftArgs) {
  useFocusEffect(
    useCallback(() => {
      const draft = getSendDraftSnapshot();
      setAccountNumber(draft.accountNumber);
      setEthereumRecipient(draft.ethereumRecipient);
      setSolanaRecipient(draft.solanaRecipient);
    }, [setAccountNumber, setEthereumRecipient, setSolanaRecipient]),
  );
}
