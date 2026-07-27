import { getAlchemyApiKey } from '@/lib/alchemy/alchemyCredentials';
import {
  ALCHEMY_EVM_NETWORKS,
  getNetworkLabel,
  type AlchemyEvmNetwork,
} from '@/lib/alchemy/networks';

export const EVM_CHAIN_IDS: Record<AlchemyEvmNetwork, number> = {
  'eth-mainnet': 1,
  'base-mainnet': 8453,
  'arb-mainnet': 42161,
  'opt-mainnet': 10,
  'polygon-mainnet': 137,
};

const NATIVE_CURRENCY: Record<
  AlchemyEvmNetwork,
  { name: string; symbol: string; decimals: number }
> = {
  'eth-mainnet': { name: 'Ether', symbol: 'ETH', decimals: 18 },
  'base-mainnet': { name: 'Ether', symbol: 'ETH', decimals: 18 },
  'arb-mainnet': { name: 'Ether', symbol: 'ETH', decimals: 18 },
  'opt-mainnet': { name: 'Ether', symbol: 'ETH', decimals: 18 },
  'polygon-mainnet': { name: 'POL', symbol: 'POL', decimals: 18 },
};

export function isAlchemyEvmNetwork(
  network: string,
): network is AlchemyEvmNetwork {
  return (ALCHEMY_EVM_NETWORKS as readonly string[]).includes(network);
}

export function getEvmChainId(network: string): number {
  if (!isAlchemyEvmNetwork(network)) {
    throw new Error(`Unsupported EVM network: ${network}`);
  }
  return EVM_CHAIN_IDS[network];
}

export function getAlchemyRpcUrl(network: string): string {
  const apiKey = getAlchemyApiKey();
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_ALCHEMY_API_KEY');
  }
  return `https://${network}.g.alchemy.com/v2/${apiKey}`;
}

export function getSolanaRpcUrl(): string {
  return getAlchemyRpcUrl('solana-mainnet');
}

export function getEvmNativeCurrency(network: string) {
  if (!isAlchemyEvmNetwork(network)) {
    return { name: 'Ether', symbol: 'ETH', decimals: 18 };
  }
  return NATIVE_CURRENCY[network];
}

export function getEvmAddChainParams(network: string) {
  if (!isAlchemyEvmNetwork(network)) {
    throw new Error(`Unsupported EVM network: ${network}`);
  }

  const chainId = EVM_CHAIN_IDS[network];
  return {
    chainId: `0x${chainId.toString(16)}`,
    chainName: getNetworkLabel(network),
    nativeCurrency: NATIVE_CURRENCY[network],
    rpcUrls: [getAlchemyRpcUrl(network)],
  };
}

export function toHexQuantity(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}`;
}
