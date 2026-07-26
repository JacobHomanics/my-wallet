import {
  useCreateWallet as useCreateEthereumWallet,
} from '@privy-io/react-auth';
import { useCreateWallet as useCreateSolanaWallet } from '@privy-io/react-auth/solana';
import { useCallback, useRef } from 'react';

import { isEmbeddedWalletAlreadyExistsError } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * Manually create embedded EVM then Solana wallets after whitelabel OTP.
 * createOnLogin does not run for loginWithCode — Privy requires this path.
 * Does not gate on `authenticated` from the current render (stale right after
 * loginWithCode); create APIs no-op/error if there is no session.
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 */
export function useCreateEmbeddedWallets() {
  const { createWallet: createEthereumWallet } = useCreateEthereumWallet();
  const { createWallet: createSolanaWallet } = useCreateSolanaWallet();
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

      try {
        await createSolanaWallet();
      } catch (error) {
        if (!isEmbeddedWalletAlreadyExistsError(error)) {
          throw error;
        }
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [createEthereumWallet, createSolanaWallet]);

  return { ensureEmbeddedWallets };
}
