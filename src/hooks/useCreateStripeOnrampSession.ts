import { useAction } from 'convex/react';
import { useCallback, useState } from 'react';

import { api } from '../../convex/_generated/api';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getStripePublishableKey } from '@/lib/stripe/stripeCredentials';
import { ONRAMP_DEFAULT_SOURCE_AMOUNT } from '@/lib/privy/onramp';

export type UseCreateStripeOnrampSessionResult = {
  isAvailable: boolean;
  isCreating: boolean;
  error: string | null;
  createSession: () => Promise<{ clientSecret: string; sessionId: string } | null>;
};

/**
 * Mints a Stripe Crypto Onramp session for the user's embedded EVM wallet.
 */
export function useCreateStripeOnrampSession(): UseCreateStripeOnrampSessionResult {
  const createSessionAction = useAction(api.onramp.createSession);
  const { wallets } = useUserWallets();
  const { selectedDestination } = useOnrampSettings();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ethereumAddress = wallets.find((w) => w.chain === 'ethereum')?.address;
  const hasPublishableKey = Boolean(getStripePublishableKey());
  const isAvailable = Boolean(ethereumAddress) && hasPublishableKey;

  const createSession = useCallback(async () => {
    if (!ethereumAddress) {
      setError('No Ethereum wallet available to deposit into.');
      return null;
    }
    if (!hasPublishableKey) {
      setError('Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const session = await createSessionAction({
        walletAddress: ethereumAddress,
        sourceAmount: ONRAMP_DEFAULT_SOURCE_AMOUNT,
        sourceCurrency: 'usd',
        destinationCurrency: selectedDestination.currency,
        destinationNetwork: selectedDestination.network,
      });
      return {
        clientSecret: session.clientSecret,
        sessionId: session.id,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not start Stripe onramp session.';
      setError(message);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [
    createSessionAction,
    ethereumAddress,
    hasPublishableKey,
    selectedDestination.currency,
    selectedDestination.network,
  ]);

  return { isAvailable, isCreating, error, createSession };
}
