/** Base chain id for Privy card onramp (`useFundWallet`). */
export const ONRAMP_BASE_CHAIN_ID = 8453;

/** Base native USDC — destination for `useFiatOnramp` (CAIP-2). */
export const ONRAMP_BASE_USDC = {
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  chain: 'eip155:8453',
} as const;
