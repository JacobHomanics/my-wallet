/**
 * Keep in sync with src/lib/alchemy/networkDefinitions.ts
 * @see https://docs.privy.io/wallets/gas-and-asset-management/gas/overview
 */
const PRIVY_GAS_SPONSORSHIP_NETWORKS = new Set<string>([
  "eth-mainnet",
  "base-mainnet",
  "arb-mainnet",
  "opt-mainnet",
  "polygon-mainnet",
  "solana-mainnet",
  "bnb-mainnet",
  "unichain-mainnet",
  "gnosis-mainnet",
  "plasma-mainnet",
  "berachain-mainnet",
  "warden-mainnet",
  "flow-mainnet",
  "fluent-mainnet",
  "edge-mainnet",
  "monad-mainnet",
  "worldchain-mainnet",
  "story-mainnet",
  "ronin-mainnet",
  "megaeth-mainnet",
  "ink-mainnet",
  "shape-mainnet",
  "robinhood-mainnet",
  "tempo-mainnet",
  "eth-sepolia",
  "base-sepolia",
  "opt-sepolia",
  "polygon-amoy",
  "arb-sepolia",
  "unichain-sepolia",
  "megaeth-testnet",
  "ronin-saigon",
  "monad-testnet",
  "ink-sepolia",
  "fluent-testnet",
  "edge-testnet",
  "robinhood-testnet",
  "shape-sepolia",
  "tempo-testnet",
  "solana-devnet",
]);

export function shouldSponsorGasForNetwork(
  network: string,
  gasSponsorshipEnabled: boolean,
): boolean {
  return gasSponsorshipEnabled && PRIVY_GAS_SPONSORSHIP_NETWORKS.has(network);
}
