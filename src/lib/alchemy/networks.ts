export const ALCHEMY_EVM_NETWORKS = [
  'eth-mainnet',
  'base-mainnet',
  'arb-mainnet',
  'opt-mainnet',
  'polygon-mainnet',
] as const;

/** Data API network enum is `solana-mainnet` (not `sol-mainnet`). */
export const ALCHEMY_SOLANA_NETWORKS = ['solana-mainnet'] as const;

export type AlchemyEvmNetwork = (typeof ALCHEMY_EVM_NETWORKS)[number];
export type AlchemySolanaNetwork = (typeof ALCHEMY_SOLANA_NETWORKS)[number];
export type AlchemyNetwork = AlchemyEvmNetwork | AlchemySolanaNetwork;

const NETWORK_LABELS: Record<AlchemyNetwork, string> = {
  'eth-mainnet': 'Ethereum',
  'base-mainnet': 'Base',
  'arb-mainnet': 'Arbitrum',
  'opt-mainnet': 'Optimism',
  'polygon-mainnet': 'Polygon',
  'solana-mainnet': 'Solana',
};

const NATIVE_TOKEN_FALLBACK: Record<
  AlchemyNetwork,
  { symbol: string; name: string; decimals: number }
> = {
  'eth-mainnet': { symbol: 'ETH', name: 'Ether', decimals: 18 },
  'base-mainnet': { symbol: 'ETH', name: 'Ether', decimals: 18 },
  'arb-mainnet': { symbol: 'ETH', name: 'Ether', decimals: 18 },
  'opt-mainnet': { symbol: 'ETH', name: 'Ether', decimals: 18 },
  'polygon-mainnet': { symbol: 'POL', name: 'POL', decimals: 18 },
  'solana-mainnet': { symbol: 'SOL', name: 'Solana', decimals: 9 },
};

export function getNetworkLabel(network: string): string {
  if (network in NETWORK_LABELS) {
    return NETWORK_LABELS[network as AlchemyNetwork];
  }
  return network;
}

export function getNativeTokenFallback(network: string) {
  if (network in NATIVE_TOKEN_FALLBACK) {
    return NATIVE_TOKEN_FALLBACK[network as AlchemyNetwork];
  }
  return { symbol: 'TOKEN', name: 'Token', decimals: 18 };
}

export function getDefaultTokenDecimals(network: string): number {
  return network === 'solana-mainnet' ? 9 : 18;
}
