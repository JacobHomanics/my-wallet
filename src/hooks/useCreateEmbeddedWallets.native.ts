import {
  useEmbeddedEthereumWallet,
  useEmbeddedSolanaWallet,
} from '@privy-io/expo';
import { useCallback } from 'react';

import { isEmbeddedWalletAlreadyExistsError } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';
import { runExclusiveEnsure } from '@/lib/privy/wallets/runExclusiveEnsure';

/**
 * Manually create embedded EVM then Solana wallets after whitelabel OTP.
 * Shared process lock prevents duplicate creates from concurrent callers.
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 */
export function useCreateEmbeddedWallets() {
  const { create: createEthereumWallet } = useEmbeddedEthereumWallet();
  const solanaWallet = useEmbeddedSolanaWallet();

  const ensureEmbeddedWallets = useCallback(async () => {
    await runExclusiveEnsure(async () => {
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
    });
  }, [createEthereumWallet, solanaWallet]);

  return { ensureEmbeddedWallets };
}
