/**
 * Privy app-pays gas sponsorship per network.
 * @see https://docs.privy.io/wallets/gas-and-asset-management/gas/overview
 */
import {
  PRIVY_GAS_SPONSORSHIP_NETWORKS,
} from '@/lib/alchemy/networkDefinitions';

export { PRIVY_GAS_SPONSORSHIP_NETWORKS };

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
