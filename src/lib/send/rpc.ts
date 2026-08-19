import { getAlchemyApiKey } from '@/lib/alchemy/alchemyCredentials';
import {
  APP_NETWORK_DEFINITIONS,
  EVM_CHAIN_IDS,
  getNetworkDefinition,
} from '@/lib/alchemy/networkDefinitions';
import {
  ALCHEMY_EVM_NETWORKS,
  getNetworkLabel,
  type AlchemyEvmNetwork,
} from '@/lib/alchemy/networks';

export { EVM_CHAIN_IDS };

const NATIVE_CURRENCY: Record<
  string,
  { name: string; symbol: string; decimals: number }
> = Object.fromEntries(
  APP_NETWORK_DEFINITIONS.filter((def) => def.chain === 'ethereum').map(
    (def) => [def.id, def.native],
  ),
);

export function isAlchemyEvmNetwork(
  network: string,
): network is AlchemyEvmNetwork {
  return (ALCHEMY_EVM_NETWORKS as readonly string[]).includes(network);
}

export function getEvmChainId(network: string): number {
  const chainId = EVM_CHAIN_IDS[network];
  if (chainId == null) {
    throw new Error(`Unsupported EVM network: ${network}`);
  }
  return chainId;
}

export function getAlchemyRpcUrl(network: string): string {
  const customRpc = getNetworkDefinition(network)?.rpcUrl;
  if (customRpc) {
    return customRpc;
  }

  const apiKey = getAlchemyApiKey();
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_ALCHEMY_API_KEY');
  }
  return `https://${network}.g.alchemy.com/v2/${apiKey}`;
}

export function getSolanaRpcUrl(): string {
  return getAlchemyRpcUrl('solana-mainnet');
}

/** WebSocket endpoint for Solana subscriptions (Privy `rpcSubscriptions`). */
export function getSolanaRpcSubscriptionsUrl(): string {
  // Alchemy free/lower tiers often reject `signatureSubscribe`. Use public WSS
  // for subscriptions while HTTP RPC can still go through Alchemy.
  return 'wss://api.mainnet-beta.solana.com';
}

export function getEvmNativeCurrency(network: string) {
  if (network in NATIVE_CURRENCY) {
    return NATIVE_CURRENCY[network];
  }
  return getNetworkDefinition(network)?.native ?? {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  };
}

export function getEvmAddChainParams(network: string) {
  const chainId = getEvmChainId(network);

  return {
    chainId: `0x${chainId.toString(16)}`,
    chainName: getNetworkLabel(network),
    nativeCurrency: getEvmNativeCurrency(network),
    rpcUrls: [getAlchemyRpcUrl(network)],
  };
}

export function toHexQuantity(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}`;
}
