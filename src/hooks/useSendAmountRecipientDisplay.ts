import { useMemo } from 'react';

import { formatWalletAddress } from '@/hooks/useUserWallets.shared';

/**
 * Read-only recipient summary for the Amount send step.
 */
export function useSendAmountRecipientDisplay(params: {
  accountNumber: string;
  ethereumRecipient: string;
  solanaRecipient: string;
  username?: string | null;
  name?: string | null;
}) {
  const trimmedAccountNumber = params.accountNumber.trim();
  const trimmedEthereum = params.ethereumRecipient.trim();
  const trimmedSolana = params.solanaRecipient.trim();
  const trimmedUsername = params.username?.trim().replace(/^@/, '') || null;
  const trimmedName = params.name?.trim() || null;

  const hasRecipient = Boolean(
    trimmedUsername ||
      trimmedName ||
      trimmedAccountNumber ||
      trimmedEthereum ||
      trimmedSolana,
  );

  const primaryLabel = useMemo(() => {
    if (trimmedUsername) {
      return `@${trimmedUsername}`;
    }
    if (trimmedName) {
      return trimmedName;
    }
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
  }, [
    trimmedAccountNumber,
    trimmedEthereum,
    trimmedName,
    trimmedSolana,
    trimmedUsername,
  ]);

  const recipientFieldLabel =
    trimmedUsername || trimmedName
      ? 'Recipient'
      : trimmedAccountNumber
        ? 'Account Number'
        : 'Recipient';

  return {
    hasRecipient,
    primaryLabel,
    recipientFieldLabel,
    trimmedAccountNumber,
    trimmedEthereum,
    trimmedSolana,
    trimmedUsername,
    trimmedName,
    showAccountNumber:
      Boolean(trimmedAccountNumber) && !trimmedUsername && !trimmedName,
  };
}
