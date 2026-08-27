import { loadCryptoOnrampAndInitialize } from '@stripe/crypto';
import type { CryptoNetwork, OnrampCoordinator } from '@stripe/crypto';

import type { OnrampDestinationNetwork } from '@/lib/onrampSettings';
import { getStripePublishableKey } from '@/lib/stripe/stripeCredentials';

let coordinatorPromise: Promise<OnrampCoordinator | null> | null = null;

/**
 * Singleton headless Crypto Onramp coordinator.
 *
 * Unlike the embedded widget, the coordinator owns cross-step state (Link
 * session, KYC, collected payment token), so every step of one purchase must
 * talk to the same instance.
 *
 * @see https://docs.stripe.com/crypto/onramp/embedded-components
 */
export function getHeadlessOnrampCoordinator(): Promise<OnrampCoordinator | null> {
  const key = getStripePublishableKey();
  if (!key) {
    return Promise.resolve(null);
  }
  if (!coordinatorPromise) {
    coordinatorPromise = loadCryptoOnrampAndInitialize(key, {
      theme: 'stripe',
    });
  }
  return coordinatorPromise;
}

/** Networks the headless flow can register a wallet on, by app network id. */
const CRYPTO_NETWORK_BY_ONRAMP_NETWORK: Record<
  OnrampDestinationNetwork,
  CryptoNetwork
> = {
  base: 'base',
  ethereum: 'ethereum',
  avalanche: 'avalanche',
};

export function toCryptoNetwork(
  network: OnrampDestinationNetwork,
): CryptoNetwork {
  return CRYPTO_NETWORK_BY_ONRAMP_NETWORK[network];
}
