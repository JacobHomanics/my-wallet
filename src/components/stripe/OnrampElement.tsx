import { useEffect, useRef, useState } from 'react';
import type { OnrampSession, OnrampSessionResult } from '@stripe/crypto';

import { useStripeOnramp } from '@/components/stripe/CryptoElements';

type OnrampElementProps = {
  clientSecret: string;
  appearance?: { theme: 'light' | 'dark' };
  onReady?: (payload: { session: OnrampSessionResult }) => void;
  onChange?: (payload: { session: OnrampSessionResult }) => void;
};

function useOnrampSessionListener(
  type: 'onramp_ui_loaded' | 'onramp_session_updated',
  session: OnrampSession | undefined,
  callback?: (payload: { session: OnrampSessionResult }) => void,
) {
  useEffect(() => {
    if (!session || !callback) {
      return;
    }
    const listener = (e: {
      payload: { session: OnrampSessionResult };
    }) => {
      callback(e.payload);
    };
    session.addEventListener(type, listener);
    return () => {
      session.removeEventListener(type, listener);
    };
  }, [session, callback, type]);
}

/**
 * Mounts Stripe's embedded Crypto Onramp into a DOM container.
 * Web-only (uses a `div` host). Import from web screens only.
 *
 * @see https://docs.stripe.com/crypto/onramp/embedded
 */
export function OnrampElement({
  clientSecret,
  appearance,
  onReady,
  onChange,
}: OnrampElementProps) {
  const stripeOnramp = useStripeOnramp();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [session, setSession] = useState<OnrampSession | undefined>();

  const appearanceJSON = JSON.stringify(appearance ?? { theme: 'light' });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !clientSecret || !stripeOnramp) {
      return;
    }

    container.innerHTML = '';
    const next = stripeOnramp
      .createSession({
        clientSecret,
        appearance: appearanceJSON
          ? (JSON.parse(appearanceJSON) as { theme: 'light' | 'dark' })
          : { theme: 'light' },
      })
      .mount(container);
    setSession(next);
  }, [appearanceJSON, clientSecret, stripeOnramp]);

  useOnrampSessionListener('onramp_ui_loaded', session, onReady);
  useOnrampSessionListener('onramp_session_updated', session, onChange);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: 420,
      }}
    />
  );
}
