import { useCallback, useState } from 'react';

import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import {
  isValidEvmAddress,
  isValidSolanaAddress,
} from '@/lib/validation';

/**
 * Advanced EVM/Solana address fields for adding a contact manually.
 */
export function useNewContactAdvanced() {
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const [name, setName] = useState('');
  const [evmAddress, setEvmAddress] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');

  const trimmedName = name.trim();
  const trimmedEvm = evmAddress.trim();
  const trimmedSolana = solanaAddress.trim();

  const evmValid = !trimmedEvm || isValidEvmAddress(trimmedEvm);
  const solanaValid = !trimmedSolana || isValidSolanaAddress(trimmedSolana);
  const hasAddress = Boolean(trimmedEvm || trimmedSolana);
  const canSubmit =
    trimmedName.length > 0 && hasAddress && evmValid && solanaValid;

  const clear = useCallback(() => {
    setName('');
    setEvmAddress('');
    setSolanaAddress('');
  }, []);

  return {
    showAdvanced,
    toggleAdvanced,
    name,
    setName,
    trimmedName,
    evmAddress,
    setEvmAddress,
    solanaAddress,
    setSolanaAddress,
    trimmedEvm,
    trimmedSolana,
    evmValid,
    solanaValid,
    canSubmit,
    clear,
  };
}
