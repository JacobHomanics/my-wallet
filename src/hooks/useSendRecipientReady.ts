import { useMemo } from 'react';

import { tryDecodeWalletIdentity } from '@/lib/walletIdentity';
import { isValidRecipientAddress } from '@/lib/validation';

/**
 * Whether the recipient step has enough info to continue to Amount.
 */
export function useSendRecipientReady(
  accountNumber: string,
  ethereumRecipient: string,
  solanaRecipient: string,
): {
  decodedAccountNumber: ReturnType<typeof tryDecodeWalletIdentity>;
  accountNumberError: string | null;
  canContinue: boolean;
} {
  const decodedAccountNumber = useMemo(
    () => tryDecodeWalletIdentity(accountNumber),
    [accountNumber],
  );

  const accountNumberError =
    accountNumber.trim() && !decodedAccountNumber
      ? 'Enter a valid account number'
      : null;

  const canContinue = useMemo(() => {
    if (decodedAccountNumber) {
      return true;
    }

    const evm = ethereumRecipient.trim();
    const solana = solanaRecipient.trim();
    const evmValid = evm.length > 0 && isValidRecipientAddress(evm, 'ethereum');
    const solanaValid =
      solana.length > 0 && isValidRecipientAddress(solana, 'solana');

    return evmValid || solanaValid;
  }, [decodedAccountNumber, ethereumRecipient, solanaRecipient]);

  return {
    decodedAccountNumber,
    accountNumberError,
    canContinue,
  };
}
