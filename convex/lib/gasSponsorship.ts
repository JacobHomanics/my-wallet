/**
 * Keep in sync with src/lib/privy/gasSponsorshipNetworks.ts
 * @see https://docs.privy.io/wallets/gas-and-asset-management/gas/overview
 */
const PRIVY_GAS_SPONSORSHIP_NETWORKS = new Set<string>([
  "eth-mainnet",
  "base-mainnet",
  "arb-mainnet",
  "opt-mainnet",
  "polygon-mainnet",
  "solana-mainnet",
]);

export function shouldSponsorGasForNetwork(
  network: string,
  gasSponsorshipEnabled: boolean,
): boolean {
  return gasSponsorshipEnabled && PRIVY_GAS_SPONSORSHIP_NETWORKS.has(network);
}
