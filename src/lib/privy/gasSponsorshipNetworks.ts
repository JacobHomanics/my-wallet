/**
 * App network IDs where Privy app-pays gas sponsorship is supported.
 * @see https://docs.privy.io/wallets/gas-and-asset-management/gas/overview
 *
 * Networks the app uses but Privy does not sponsor (e.g. Avalanche) are omitted —
 * sends there always use user-paid gas even when sponsorship is enabled.
 */
export const PRIVY_GAS_SPONSORSHIP_NETWORKS = new Set<string>([
  'eth-mainnet',
  'base-mainnet',
  'arb-mainnet',
  'opt-mainnet',
  'polygon-mainnet',
  'solana-mainnet',
]);

export function isPrivyGasSponsorshipNetwork(network: string): boolean {
  return PRIVY_GAS_SPONSORSHIP_NETWORKS.has(network);
}

/** Whether this leg should use Privy `sponsor: true`. */
export function shouldSponsorGasForNetwork(
  network: string,
  gasSponsorshipEnabled: boolean,
): boolean {
  return gasSponsorshipEnabled && isPrivyGasSponsorshipNetwork(network);
}

/** Networks to skip native gas reserves when sponsorship preference is on. */
export function sponsoredNetworksForPreference(
  gasSponsorshipEnabled: boolean,
): ReadonlySet<string> | undefined {
  return gasSponsorshipEnabled ? PRIVY_GAS_SPONSORSHIP_NETWORKS : undefined;
}
