import { useCallback, useEffect, useState } from 'react';
import type { OnrampSessionResult } from '@stripe/crypto';

/**
 * Tracks whether Stripe's embedded onramp iframe UI has finished loading.
 * Resets when `clientSecret` changes so a new session shows loading again.
 */
export function useStripeOnrampUiReady(clientSecret: string | null) {
  const [uiReady, setUiReady] = useState(false);

  useEffect(() => {
    setUiReady(false);
  }, [clientSecret]);

  const onReady = useCallback(
    (_payload: { session: OnrampSessionResult }) => {
      setUiReady(true);
    },
    [],
  );

  return { uiReady, onReady };
}
