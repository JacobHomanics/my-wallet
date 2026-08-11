import { useCallback, useState } from 'react';
import { useFiatOnramp } from '@privy-io/react-auth';

import type {
  PrivyFiatOnrampStatus,
  UsePrivyFiatOnrampResult,
} from '@/hooks/usePrivyFiatOnramp.shared';
import { useUserWallets } from '@/hooks/useUserWallets';
import {
  ONRAMP_DEFAULT_SOURCE_AMOUNT,
  PRIVY_ONRAMP_BASE_CHAIN,
  PRIVY_ONRAMP_BASE_ETH,
} from '@/lib/privy/onramp';

/**
 * Opens Privy's prebuilt fiat onramp (includes Stripe Embedded Components).
 * @see https://docs.privy.io/wallets/funding/fiat-onramp
 */
export function usePrivyFiatOnramp(): UsePrivyFiatOnrampResult {
  const { fund } = useFiatOnramp();
  const { wallets } = useUserWallets();
  const [isFunding, setIsFunding] = useState(false);
  const [status, setStatus] = useState<PrivyFiatOnrampStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ethereumAddress = wallets.find((w) => w.chain === 'ethereum')?.address;
  const isAvailable = Boolean(ethereumAddress);

  const startFund = useCallback(async () => {
    if (!ethereumAddress) {
      setError('No Ethereum wallet available to deposit into.');
      return null;
    }

    setIsFunding(true);
    setError(null);
    setStatus(null);

    try {
      const result = await fund({
        source: {
          assets: ['usd'],
          defaultAsset: 'usd',
        },
        destination: {
          asset: PRIVY_ONRAMP_BASE_ETH,
          chain: PRIVY_ONRAMP_BASE_CHAIN,
          address: ethereumAddress,
        },
        environment: 'production',
        defaultAmount: ONRAMP_DEFAULT_SOURCE_AMOUNT,
      });

      setStatus(result.status);
      return result.status;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not complete the deposit flow.';
      setError(message);
      return null;
    } finally {
      setIsFunding(false);
    }
  }, [ethereumAddress, fund]);

  return { isAvailable, isFunding, status, error, startFund };
}
