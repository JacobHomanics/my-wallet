/** Deposit flows available on web. */
export type DepositMethodId = 'stripe' | 'fund-wallet';

export type DepositMethodOption = {
  id: DepositMethodId;
  label: string;
  description: string;
  icon: 'card-outline' | 'wallet-outline';
};

export const DEPOSIT_METHODS: readonly DepositMethodOption[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    description: 'Card, Apple Pay, or Google Pay (embedded onramp)',
    icon: 'card-outline',
  },
  {
    id: 'fund-wallet',
    label: 'Coinbase / MoonPay',
    description: 'Buy USDC in a provider popup',
    icon: 'wallet-outline',
  },
] as const;

/** Default fiat amount prefilled in onramp UIs. */
export const ONRAMP_DEFAULT_SOURCE_AMOUNT = '3';

/** Base native USDC — default fiat onramp destination. */
export const ONRAMP_BASE_USDC = {
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  chain: 'eip155:8453',
  chainId: 8453,
} as const;
