import { useCallback, useState } from 'react';
import { useFundWallet } from '@privy-io/react-auth';

import { useUserWallets } from '@/hooks/useUserWallets';
import {
  ONRAMP_BASE_USDC,
  ONRAMP_DEFAULT_SOURCE_AMOUNT,
  type DepositMethodId,
} from '@/lib/privy/onramp';

export type FiatOnrampDepositStatus = 'submitted' | 'confirmed';

export type UseFiatOnrampDepositResult = {
  /** Deposit is available when an embedded EVM wallet exists. */
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  /**
   * Starts a deposit flow.
   * - `stripe`: navigate to Stripe embedded onramp screen (handled by caller)
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
 * Stripe uses the embedded Crypto Onramp screen; Coinbase/MoonPay use Fund Wallet.
 *
 * @see https://docs.stripe.com/crypto/onramp/embedded
 * @see https://docs.privy.io/wallets/funding/fiat-onramp
 */
export function useFiatOnrampDeposit(): UseFiatOnrampDepositResult {
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

      if (method === 'stripe') {
        // Caller navigates to `stripeOnramp` — no Privy Stripe modal.
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fundWallet({
          address: ethereumAddress,
          options: {
            chain: { id: ONRAMP_BASE_USDC.chainId },
            amount: ONRAMP_DEFAULT_SOURCE_AMOUNT,
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
    [ethereumAddress, fundWallet],
  );

  return { isAvailable, isLoading, error, deposit };
}
