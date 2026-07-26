import {
  useCreateWallet as useCreateEthereumWallet,
} from '@privy-io/react-auth';
import { useCreateWallet as useCreateSolanaWallet } from '@privy-io/react-auth/solana';
import { useCallback } from 'react';

import { isEmbeddedWalletAlreadyExistsError } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';
import { runExclusiveEnsure } from '@/lib/privy/wallets/runExclusiveEnsure';

/**
 * Manually create embedded EVM then Solana wallets after whitelabel OTP.
 * Shared process lock prevents duplicate creates from concurrent callers.
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 */
export function useCreateEmbeddedWallets() {
  const { createWallet: createEthereumWallet } = useCreateEthereumWallet();
  const { createWallet: createSolanaWallet } = useCreateSolanaWallet();

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

      try {
        await createSolanaWallet();
      } catch (error) {
        if (!isEmbeddedWalletAlreadyExistsError(error)) {
          throw error;
        }
      }
    });
  }, [createEthereumWallet, createSolanaWallet]);

  return { ensureEmbeddedWallets };
}
