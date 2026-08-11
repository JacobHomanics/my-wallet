import { useCallback, useState } from 'react';
import type { OnrampSessionResult } from '@stripe/crypto';

/**
 * Tracks whether Stripe's embedded onramp iframe UI has finished loading.
 * Becomes false again when `clientSecret` changes so a new session shows loading.
 */
export function useStripeOnrampUiReady(clientSecret: string | null) {
  const [readySecret, setReadySecret] = useState<string | null>(null);
  const uiReady = clientSecret !== null && readySecret === clientSecret;

  const onReady = useCallback(
    (_payload: { session: OnrampSessionResult }) => {
      if (clientSecret) {
        setReadySecret(clientSecret);
      }
    },
    [clientSecret],
  );

  return { uiReady, onReady };
}
