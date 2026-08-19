/**
 * App network registry. Alchemy slugs match Portfolio API / RPC hostnames where possible.
 * @see https://docs.privy.io/wallets/gas-and-asset-management/gas/overview
 */

export type NetworkNative = {
  symbol: string;
  name: string;
  decimals: number;
};

export type AppNetworkDefinition = {
  id: string;
  label: string;
  chain: 'ethereum' | 'solana';
  /** EVM chain ID (CAIP-2). */
  chainId?: number;
  native: NetworkNative;
  /** Include in Alchemy Portfolio balance / history queries (mainnet production). */
  portfolio: boolean;
  /** Privy app-pays gas sponsorship (@see gas overview). */
  gasSponsorship: boolean;
  /** L2-style gas limit headroom for sends / reserves. */
  l2?: boolean;
  /** Trust Wallet assets chain slug for icons. */
  iconChain?: string;
  /** Non-Alchemy RPC when Portfolio / Alchemy RPC is unavailable. */
  rpcUrl?: string;
};

const ETH_NATIVE: NetworkNative = { symbol: 'ETH', name: 'Ether', decimals: 18 };

/** EVM + Solana networks the app knows about. */
export const APP_NETWORK_DEFINITIONS: readonly AppNetworkDefinition[] = [
  // —— Existing production mainnets ——
  {
    id: 'eth-mainnet',
    label: 'Ethereum',
    chain: 'ethereum',
    chainId: 1,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'ethereum',
  },
  {
    id: 'base-mainnet',
    label: 'Base',
    chain: 'ethereum',
    chainId: 8453,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
    iconChain: 'base',
  },
  {
    id: 'arb-mainnet',
    label: 'Arbitrum',
    chain: 'ethereum',
    chainId: 42161,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
    iconChain: 'arbitrum',
  },
  {
    id: 'opt-mainnet',
    label: 'Optimism',
    chain: 'ethereum',
    chainId: 10,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
    iconChain: 'optimism',
  },
  {
    id: 'polygon-mainnet',
    label: 'Polygon',
    chain: 'ethereum',
    chainId: 137,
    native: { symbol: 'POL', name: 'POL', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    l2: true,
    iconChain: 'polygon',
  },
  {
    id: 'avax-mainnet',
    label: 'Avalanche',
    chain: 'ethereum',
    chainId: 43114,
    native: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    portfolio: true,
    gasSponsorship: false,
    l2: true,
    iconChain: 'avalanche',
  },
  {
    id: 'solana-mainnet',
    label: 'Solana',
    chain: 'solana',
    native: { symbol: 'SOL', name: 'Solana', decimals: 9 },
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'solana',
  },

  // —— Privy gas-sponsored EVM mainnets ——
  {
    id: 'bnb-mainnet',
    label: 'BNB Smart Chain',
    chain: 'ethereum',
    chainId: 56,
    native: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'smartchain',
  },
  {
    id: 'unichain-mainnet',
    label: 'Unichain',
    chain: 'ethereum',
    chainId: 130,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'gnosis-mainnet',
    label: 'Gnosis',
    chain: 'ethereum',
    chainId: 100,
    native: { symbol: 'xDAI', name: 'xDAI', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'xdai',
  },
  {
    id: 'plasma-mainnet',
    label: 'Plasma',
    chain: 'ethereum',
    chainId: 9745,
    native: { symbol: 'XPL', name: 'Plasma', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'berachain-mainnet',
    label: 'Berachain',
    chain: 'ethereum',
    chainId: 80094,
    native: { symbol: 'BERA', name: 'Berachain', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'berachain',
  },
  {
    id: 'warden-mainnet',
    label: 'Warden',
    chain: 'ethereum',
    chainId: 8765,
    native: { symbol: 'WARD', name: 'Warden', decimals: 18 },
    portfolio: false,
    gasSponsorship: true,
    rpcUrl: 'https://evm.wardenprotocol.org/',
  },
  {
    id: 'flow-mainnet',
    label: 'Flow',
    chain: 'ethereum',
    chainId: 747,
    native: { symbol: 'FLOW', name: 'Flow', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'flow',
  },
  {
    id: 'fluent-mainnet',
    label: 'Fluent',
    chain: 'ethereum',
    chainId: 25363,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
    rpcUrl: 'https://rpc.fluent.xyz/',
  },
  {
    id: 'edge-mainnet',
    label: 'Edge',
    chain: 'ethereum',
    chainId: 3343,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'monad-mainnet',
    label: 'Monad',
    chain: 'ethereum',
    chainId: 143,
    native: { symbol: 'MON', name: 'Monad', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'worldchain-mainnet',
    label: 'World Chain',
    chain: 'ethereum',
    chainId: 480,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'story-mainnet',
    label: 'Story',
    chain: 'ethereum',
    chainId: 1514,
    native: { symbol: 'IP', name: 'Story', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'story',
  },
  {
    id: 'ronin-mainnet',
    label: 'Ronin',
    chain: 'ethereum',
    chainId: 2020,
    native: { symbol: 'RON', name: 'Ronin', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
    iconChain: 'ronin',
  },
  {
    id: 'megaeth-mainnet',
    label: 'MegaETH',
    chain: 'ethereum',
    chainId: 4326,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'ink-mainnet',
    label: 'Ink',
    chain: 'ethereum',
    chainId: 57073,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'shape-mainnet',
    label: 'Shape',
    chain: 'ethereum',
    chainId: 360,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'robinhood-mainnet',
    label: 'Robinhood Chain',
    chain: 'ethereum',
    chainId: 4663,
    native: ETH_NATIVE,
    portfolio: true,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'tempo-mainnet',
    label: 'Tempo',
    chain: 'ethereum',
    chainId: 4217,
    native: { symbol: 'USD', name: 'Tempo USD', decimals: 18 },
    portfolio: true,
    gasSponsorship: true,
  },

  // —— Privy gas-sponsored EVM testnets (sends / sponsorship only) ——
  {
    id: 'eth-sepolia',
    label: 'Sepolia',
    chain: 'ethereum',
    chainId: 11155111,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    iconChain: 'ethereum',
  },
  {
    id: 'base-sepolia',
    label: 'Base Sepolia',
    chain: 'ethereum',
    chainId: 84532,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
    iconChain: 'base',
  },
  {
    id: 'opt-sepolia',
    label: 'OP Sepolia',
    chain: 'ethereum',
    chainId: 11155420,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
    iconChain: 'optimism',
  },
  {
    id: 'polygon-amoy',
    label: 'Polygon Amoy',
    chain: 'ethereum',
    chainId: 80002,
    native: { symbol: 'POL', name: 'POL', decimals: 18 },
    portfolio: false,
    gasSponsorship: true,
    l2: true,
    iconChain: 'polygon',
  },
  {
    id: 'arb-sepolia',
    label: 'Arbitrum Sepolia',
    chain: 'ethereum',
    chainId: 421614,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
    iconChain: 'arbitrum',
  },
  {
    id: 'unichain-sepolia',
    label: 'Unichain Sepolia',
    chain: 'ethereum',
    chainId: 1301,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'megaeth-testnet',
    label: 'MegaETH Testnet',
    chain: 'ethereum',
    chainId: 6342,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'ronin-saigon',
    label: 'Ronin Saigon',
    chain: 'ethereum',
    chainId: 2021,
    native: { symbol: 'RON', name: 'Ronin', decimals: 18 },
    portfolio: false,
    gasSponsorship: true,
    iconChain: 'ronin',
  },
  {
    id: 'monad-testnet',
    label: 'Monad Testnet',
    chain: 'ethereum',
    chainId: 10143,
    native: { symbol: 'MON', name: 'Monad', decimals: 18 },
    portfolio: false,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'ink-sepolia',
    label: 'Ink Sepolia',
    chain: 'ethereum',
    chainId: 763373,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'fluent-testnet',
    label: 'Fluent Testnet',
    chain: 'ethereum',
    chainId: 20994,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
    rpcUrl: 'https://rpc.testnet.fluent.xyz/',
  },
  {
    id: 'edge-testnet',
    label: 'Edge Testnet',
    chain: 'ethereum',
    chainId: 33431,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'robinhood-testnet',
    label: 'Robinhood Testnet',
    chain: 'ethereum',
    chainId: 46630,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'shape-sepolia',
    label: 'Shape Sepolia',
    chain: 'ethereum',
    chainId: 11011,
    native: ETH_NATIVE,
    portfolio: false,
    gasSponsorship: true,
    l2: true,
  },
  {
    id: 'tempo-testnet',
    label: 'Tempo Testnet',
    chain: 'ethereum',
    chainId: 42429,
    native: { symbol: 'USD', name: 'Tempo USD', decimals: 18 },
    portfolio: false,
    gasSponsorship: true,
  },

  // —— Privy gas-sponsored Solana testnet ——
  {
    id: 'solana-devnet',
    label: 'Solana Devnet',
    chain: 'solana',
    native: { symbol: 'SOL', name: 'Solana', decimals: 9 },
    portfolio: false,
    gasSponsorship: true,
    iconChain: 'solana',
  },
] as const;

const DEFINITION_BY_ID = new Map(
  APP_NETWORK_DEFINITIONS.map((def) => [def.id, def] as const),
);

export function getNetworkDefinition(
  network: string,
): AppNetworkDefinition | undefined {
  return DEFINITION_BY_ID.get(network);
}

export function isL2EvmNetwork(network: string): boolean {
  return getNetworkDefinition(network)?.l2 === true;
}

export const ALCHEMY_EVM_NETWORKS = APP_NETWORK_DEFINITIONS.filter(
  (def) => def.chain === 'ethereum' && def.portfolio,
).map((def) => def.id) as readonly string[];

export type AlchemyEvmNetwork = (typeof ALCHEMY_EVM_NETWORKS)[number];

export const ALCHEMY_SOLANA_NETWORKS = APP_NETWORK_DEFINITIONS.filter(
  (def) => def.chain === 'solana' && def.portfolio,
).map((def) => def.id) as readonly string[];

export type AlchemySolanaNetwork = (typeof ALCHEMY_SOLANA_NETWORKS)[number];

export type AlchemyNetwork = AlchemyEvmNetwork | AlchemySolanaNetwork;

export const PRIVY_GAS_SPONSORSHIP_NETWORKS = new Set(
  APP_NETWORK_DEFINITIONS.filter((def) => def.gasSponsorship).map(
    (def) => def.id,
  ),
);

/** EVM chain IDs for sends / CAIP-2 (includes testnets). Keep convex/lib/networks.ts in sync. */
export const EVM_CHAIN_IDS: Record<string, number> = Object.fromEntries(
  APP_NETWORK_DEFINITIONS.filter(
    (def): def is AppNetworkDefinition & { chainId: number } =>
      def.chain === 'ethereum' && def.chainId != null,
  ).map((def) => [def.id, def.chainId]),
);
