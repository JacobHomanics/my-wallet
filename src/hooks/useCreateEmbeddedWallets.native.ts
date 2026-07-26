import {
  useEmbeddedEthereumWallet,
  useEmbeddedSolanaWallet,
} from '@privy-io/expo';
import { useCallback, useRef } from 'react';

import { isEmbeddedWalletAlreadyExistsError } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * Manually create embedded EVM then Solana wallets after whitelabel OTP.
 * Does not gate on hook `user` (can be stale immediately after loginWithCode).
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 */
export function useCreateEmbeddedWallets() {
  const { create: createEthereumWallet } = useEmbeddedEthereumWallet();
  const solanaWallet = useEmbeddedSolanaWallet();
  const inFlightRef = useRef(false);

  const ensureEmbeddedWallets = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    try {
      // Always create EVM before Solana.
      try {
        await createEthereumWallet();
      } catch (error) {
        if (!isEmbeddedWalletAlreadyExistsError(error)) {
          throw error;
        }
      }

      if (
        'create' in solanaWallet &&
        typeof solanaWallet.create === 'function'
      ) {
        try {
          await solanaWallet.create();
        } catch (error) {
          if (!isEmbeddedWalletAlreadyExistsError(error)) {
            throw error;
          }
        }
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [createEthereumWallet, solanaWallet]);

  return { ensureEmbeddedWallets };
}
