import { useState } from 'react';
import { useAddFunds } from '@privy-io/react-auth';

import {
  DEFAULT_DEPOSIT_ASSET,
  DEFAULT_DEPOSIT_CHAIN,
  type DepositResult,
} from '@/hooks/useDeposit.shared';
import { useUserWallets } from '@/hooks/useUserWallets';

/**
 * Opens Privy's unified add-funds / deposit flow for the embedded Ethereum wallet (web).
 * Requires funding methods enabled in the Privy Dashboard.
 * @see https://docs.privy.io/wallets/funding/add-funds
 */
export function useDeposit(): DepositResult {
  const { addFunds } = useAddFunds();
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
        await addFunds({
          destination: {
            address: ethereumAddress,
            chain: DEFAULT_DEPOSIT_CHAIN,
            asset: DEFAULT_DEPOSIT_ASSET,
          },
          fiat: {
            environment: 'production',
          },
          crypto: {},
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Deposit was cancelled or failed';
        if (!/cancel|closed|dismiss/i.test(message)) {
          setError(message);
        }
      } finally {
        setIsDepositing(false);
      }
    },
  };
}
