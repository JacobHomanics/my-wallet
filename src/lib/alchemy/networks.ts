import {
  ALCHEMY_EVM_NETWORKS,
  ALCHEMY_SOLANA_NETWORKS,
  APP_NETWORK_DEFINITIONS,
  getNetworkDefinition,
  type AlchemyEvmNetwork,
  type AlchemyNetwork,
  type AlchemySolanaNetwork,
} from '@/lib/alchemy/networkDefinitions';

export {
  ALCHEMY_EVM_NETWORKS,
  ALCHEMY_SOLANA_NETWORKS,
  type AlchemyEvmNetwork,
  type AlchemyNetwork,
  type AlchemySolanaNetwork,
};

const NETWORK_LABELS: Record<string, string> = Object.fromEntries(
  APP_NETWORK_DEFINITIONS.map((def) => [def.id, def.label]),
);

const NATIVE_TOKEN_FALLBACK: Record<
  string,
  { symbol: string; name: string; decimals: number }
> = Object.fromEntries(
  APP_NETWORK_DEFINITIONS.map((def) => [def.id, def.native]),
);

export function getNetworkLabel(network: string): string {
  return NETWORK_LABELS[network] ?? network;
}

export function getNativeTokenFallback(network: string) {
  return (
    NATIVE_TOKEN_FALLBACK[network] ?? {
      symbol: 'TOKEN',
      name: 'Token',
      decimals: getNetworkDefinition(network)?.chain === 'solana' ? 9 : 18,
    }
  );
}

export function getDefaultTokenDecimals(network: string): number {
  return getNetworkDefinition(network)?.native.decimals ?? 18;
}

export function isSolanaNetwork(network: string): boolean {
  return getNetworkDefinition(network)?.chain === 'solana';
}

export function getNetworkChain(
  network: string,
): 'ethereum' | 'solana' {
  return isSolanaNetwork(network) ? 'solana' : 'ethereum';
}
