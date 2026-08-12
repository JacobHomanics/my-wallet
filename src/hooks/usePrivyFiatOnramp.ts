import { useCallback, useState } from 'react';
import { useFiatOnramp } from '@privy-io/react-auth';

import {
  isPrivyFiatOnrampUserExit,
  type PrivyFiatOnrampStatus,
  type UsePrivyFiatOnrampResult,
} from '@/hooks/usePrivyFiatOnramp.shared';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { useUserWallets } from '@/hooks/useUserWallets';
import {
  getPrivyOnrampDestination,
  ONRAMP_DEFAULT_SOURCE_AMOUNT,
} from '@/lib/privy/onramp';

/**
 * Opens Privy's prebuilt fiat onramp (includes Stripe Embedded Components).
 * @see https://docs.privy.io/wallets/funding/fiat-onramp
 */
export function usePrivyFiatOnramp(): UsePrivyFiatOnrampResult {
  const { fund } = useFiatOnramp();
  const { wallets } = useUserWallets();
  const { selectedNetwork, selectedCurrency } = useOnrampSettings();
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
      const destination = getPrivyOnrampDestination({
        network: selectedNetwork.id,
        currency: selectedCurrency.id,
      });
      if (!destination) {
        setError('That asset is not supported on the selected onramp network.');
        return null;
      }

      const result = await fund({
        source: {
          assets: ['usd'],
          defaultAsset: 'usd',
        },
        destination: {
          asset: destination.asset,
          chain: destination.chain,
          address: ethereumAddress,
        },
        environment: 'production',
        defaultAmount: ONRAMP_DEFAULT_SOURCE_AMOUNT,
      });

      setStatus(result.status);
      return result.status;
    } catch (err) {
      if (isPrivyFiatOnrampUserExit(err)) {
        return 'exited';
      }
      const message =
        err instanceof Error
          ? err.message
          : 'Could not complete the deposit flow.';
      setError(message);
      return null;
    } finally {
      setIsFunding(false);
    }
  }, [
    ethereumAddress,
    fund,
    selectedCurrency.id,
    selectedNetwork.id,
  ]);

  return { isAvailable, isFunding, status, error, startFund };
}
