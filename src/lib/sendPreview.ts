import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkLabel } from '@/lib/alchemy/networks';

/** Sample available balance shown on Pay amount when signed out. */
export const SEND_PREVIEW_AVAILABLE_USD = 13.37;

const PREVIEW_USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const SEND_PREVIEW_TOKENS: OwnedToken[] = [
  {
    id: `base-mainnet:${PREVIEW_USDC_BASE}`,
    network: 'base-mainnet',
    networkLabel: getNetworkLabel('base-mainnet'),
    tokenAddress: PREVIEW_USDC_BASE,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    rawBalance: 13_370_000n,
    balanceFormatted: '13.37',
    usdValue: SEND_PREVIEW_AVAILABLE_USD,
    logoUrl: null,
  },
];
