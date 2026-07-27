import { useState } from 'react';
import { useFundWallet } from '@privy-io/expo/ui';

import {
  type DepositResult,
} from '@/hooks/useDeposit.shared';
import { useUserWallets } from '@/hooks/useUserWallets';

/**
 * Opens Privy's funding UI for the user's embedded Ethereum wallet (native).
 * Requires funding methods enabled in the Privy Dashboard.
 * @see https://docs.privy.io/wallets/funding/legacy/evm
 */
export function useDeposit(): DepositResult {
  const { fundWallet } = useFundWallet();
  const { wallets } = useUserWallets();
  const ethereumAddress =
    wallets.find((wallet) => wallet.chain === 'ethereum')?.address ?? null;

  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    canDeposit: Boolean(ethereumAddress),
    isDepositing,
    error,
    deposit: async () => {
      if (!ethereumAddress) {
        setError('Ethereum wallet is not ready yet');
        return;
      }

      setIsDepositing(true);
      setError(null);
      try {
        await fundWallet({ address: ethereumAddress });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Deposit was cancelled or failed';
        // User dismissals are common; only surface unexpected errors.
        if (!/cancel|closed|dismiss/i.test(message)) {
          setError(message);
        }
      } finally {
        setIsDepositing(false);
      }
    },
  };
}
