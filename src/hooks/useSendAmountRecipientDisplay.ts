import { useMemo } from 'react';

import { formatWalletAddress } from '@/hooks/useUserWallets.shared';

/**
 * Read-only recipient summary for the Amount send step.
 */
export function useSendAmountRecipientDisplay(params: {
  accountNumber: string;
  ethereumRecipient: string;
  solanaRecipient: string;
}) {
  const trimmedAccountNumber = params.accountNumber.trim();
  const trimmedEthereum = params.ethereumRecipient.trim();
  const trimmedSolana = params.solanaRecipient.trim();

  const hasRecipient = Boolean(
    trimmedAccountNumber || trimmedEthereum || trimmedSolana,
  );

  const primaryLabel = useMemo(() => {
    if (trimmedAccountNumber) {
      return formatWalletAddress(trimmedAccountNumber, 10, 8);
    }
    if (trimmedEthereum && trimmedSolana) {
      return `${formatWalletAddress(trimmedEthereum, 6, 4)} · ${formatWalletAddress(trimmedSolana, 6, 4)}`;
    }
    if (trimmedEthereum) {
      return formatWalletAddress(trimmedEthereum, 6, 4);
    }
    if (trimmedSolana) {
      return formatWalletAddress(trimmedSolana, 6, 4);
    }
    return null;
  }, [trimmedAccountNumber, trimmedEthereum, trimmedSolana]);

  return {
    hasRecipient,
    primaryLabel,
    trimmedAccountNumber,
    trimmedEthereum,
    trimmedSolana,
    showAccountNumber: Boolean(trimmedAccountNumber),
  };
}
