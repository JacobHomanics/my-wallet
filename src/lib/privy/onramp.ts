import type {
  OnrampDestinationCurrency,
  OnrampDestinationNetwork,
} from '@/lib/onrampSettings';

/** Default fiat amount prefilled in onramp UIs. */
export const ONRAMP_DEFAULT_SOURCE_AMOUNT = '3';

export type PrivyOnrampDestination = {
  chain: `eip155:${number}`;
  asset: string;
};

/**
 * Privy fiat onramp destinations we expose in settings.
 * Stripe Embedded Components (within Privy) supports USDC on Base, Ethereum,
 * Solana, and Arbitrum — see https://docs.privy.io/wallets/funding/fiat-onramp
 */
const PRIVY_ONRAMP_DESTINATIONS: Record<
  OnrampDestinationNetwork,
  Record<OnrampDestinationCurrency, PrivyOnrampDestination | null>
> = {
  ethereum: {
    eth: null,
    usdc: {
      chain: 'eip155:1',
      asset: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    avax: null,
  },
  base: {
    eth: null,
    usdc: {
      chain: 'eip155:8453',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    avax: null,
  },
  avalanche: {
    eth: null,
    usdc: null,
    avax: null,
  },
};

export function getPrivyOnrampDestination(params: {
  network: OnrampDestinationNetwork;
  currency: OnrampDestinationCurrency;
}): PrivyOnrampDestination | null {
  return PRIVY_ONRAMP_DESTINATIONS[params.network][params.currency];
}
