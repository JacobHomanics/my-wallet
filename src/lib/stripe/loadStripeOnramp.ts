import { loadStripeOnramp } from '@stripe/crypto';
import type { StripeOnramp } from '@stripe/crypto';

import { getStripePublishableKey } from '@/lib/stripe/stripeCredentials';

let stripeOnrampPromise: Promise<StripeOnramp | null> | null = null;

/**
 * Singleton Stripe Onramp loader — call once, reuse across mounts.
 * @see https://docs.stripe.com/crypto/onramp/embedded-quickstart
 */
export function getStripeOnramp(): Promise<StripeOnramp | null> {
  const key = getStripePublishableKey();
  if (!key) {
    return Promise.resolve(null);
  }
  if (!stripeOnrampPromise) {
    stripeOnrampPromise = loadStripeOnramp(key);
  }
  return stripeOnrampPromise;
}
