import { useCallback, useState } from 'react';

import {
  isValidEvmAddress,
  isValidSolanaAddress,
} from '@/lib/validation';

/**
 * EVM/Solana address fields for send advanced search.
 */
export function useSendWalletRecipient() {
  const [evmAddress, setEvmAddress] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');

  const trimmedEvm = evmAddress.trim();
  const trimmedSolana = solanaAddress.trim();

  const evmValid = !trimmedEvm || isValidEvmAddress(trimmedEvm);
  const solanaValid = !trimmedSolana || isValidSolanaAddress(trimmedSolana);
  const hasAddress = Boolean(trimmedEvm || trimmedSolana);
  const canContinue = hasAddress && evmValid && solanaValid;

  const clear = useCallback(() => {
    setEvmAddress('');
    setSolanaAddress('');
  }, []);

  return {
    evmAddress,
    setEvmAddress,
    solanaAddress,
    setSolanaAddress,
    trimmedEvm,
    trimmedSolana,
    evmValid,
    solanaValid,
    canContinue,
    clear,
  };
}
