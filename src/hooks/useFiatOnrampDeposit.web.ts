import { useCallback, useState } from 'react';
import { useFiatOnramp } from '@privy-io/react-auth';

import { useUserWallets } from '@/hooks/useUserWallets';
import { ONRAMP_BASE_USDC } from '@/lib/privy/onramp';

export type FiatOnrampDepositStatus = 'submitted' | 'confirmed';

export type UseFiatOnrampDepositResult = {
  /** Privy card onramp is wired for web only. */
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  /**
   * Opens Privy's fiat onramp modal (card / Apple Pay / Google Pay).
   * Resolves with provider status, or `null` if unavailable / user cancelled.
   */
  deposit: () => Promise<FiatOnrampDepositStatus | null>;
};

/**
 * Web: buy Base USDC into the user's embedded EVM wallet via Privy `useFiatOnramp`.
 * @see https://docs.privy.io/wallets/funding/fiat-onramp
 */
export function useFiatOnrampDeposit(): UseFiatOnrampDepositResult {
  const { fund } = useFiatOnramp();
  const { wallets } = useUserWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ethereumAddress = wallets.find((w) => w.chain === 'ethereum')?.address;
  const isAvailable = Boolean(ethereumAddress);

  const deposit = useCallback(async (): Promise<FiatOnrampDepositStatus | null> => {
    if (!ethereumAddress) {
      setError('No Ethereum wallet available to deposit into.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fund({
        source: {
          assets: ['usd', 'eur', 'gbp'],
          defaultAsset: 'usd',
        },
        destination: {
          asset: ONRAMP_BASE_USDC.asset,
          chain: ONRAMP_BASE_USDC.chain,
          address: ethereumAddress,
        },
        defaultAmount: '50',
      });

      return result.status;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Deposit was cancelled or failed.';
      // User closing the modal is expected; don't treat as a hard UI error.
      const cancelled =
        /close|cancel|dismiss|abort/i.test(message) ||
        message.toLowerCase().includes('already in progress');
      if (!cancelled) {
        setError(message);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ethereumAddress, fund]);

  return { isAvailable, isLoading, error, deposit };
}
