import { useCallback, useState } from 'react';
import { useFiatOnramp, useFundWallet } from '@privy-io/react-auth';

import { useUserWallets } from '@/hooks/useUserWallets';
import {
  ONRAMP_BASE_USDC,
  type DepositMethodId,
} from '@/lib/privy/onramp';

export type FiatOnrampDepositStatus = 'submitted' | 'confirmed';

export type UseFiatOnrampDepositResult = {
  /** Card onramp is wired for web only. */
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  /**
   * Starts the chosen deposit flow.
   * - `stripe`: Privy `useFiatOnramp` (embedded Stripe onramp)
   * - `fund-wallet`: Privy `useFundWallet` (Coinbase / MoonPay popup)
   */
  deposit: (
    method: DepositMethodId,
  ) => Promise<FiatOnrampDepositStatus | null>;
};

function isUserCancelled(message: string) {
  return (
    /close|cancel|dismiss|abort/i.test(message) ||
    message.toLowerCase().includes('already in progress')
  );
}

/**
 * Web: buy Base USDC into the user's embedded EVM wallet.
 * Supports Stripe (`useFiatOnramp`) and Fund Wallet (`useFundWallet`).
 *
 * @see https://docs.privy.io/wallets/funding/fiat-onramp
 */
export function useFiatOnrampDeposit(): UseFiatOnrampDepositResult {
  const { fund: fundWithStripe } = useFiatOnramp();
  const { fundWallet } = useFundWallet();
  const { wallets } = useUserWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ethereumAddress = wallets.find((w) => w.chain === 'ethereum')?.address;
  const isAvailable = Boolean(ethereumAddress);

  const deposit = useCallback(
    async (method: DepositMethodId): Promise<FiatOnrampDepositStatus | null> => {
      if (!ethereumAddress) {
        setError('No Ethereum wallet available to deposit into.');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (method === 'stripe') {
          const result = await fundWithStripe({
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
        }

        const result = await fundWallet({
          address: ethereumAddress,
          options: {
            chain: { id: ONRAMP_BASE_USDC.chainId },
            amount: '50',
            asset: 'USDC',
            defaultFundingMethod: 'card',
          },
        });

        if (result.status === 'completed') {
          return 'confirmed';
        }
        return null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Deposit was cancelled or failed.';
        if (!isUserCancelled(message)) {
          setError(message);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [ethereumAddress, fundWallet, fundWithStripe],
  );

  return { isAvailable, isLoading, error, deposit };
}
