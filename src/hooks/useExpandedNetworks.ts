import { useCallback, useState } from 'react';

import { UNKNOWN_TOKEN_NETWORK } from '@/lib/alchemy/fetchTokensByAddress';

/** Priced chains open by default; Unknown (+ nested groups) stay closed. */
export function defaultNetworkExpanded(network: string) {
  return (
    network !== UNKNOWN_TOKEN_NETWORK &&
    !network.startsWith(`${UNKNOWN_TOKEN_NETWORK}:`)
  );
}

export function isNetworkExpandedInState(
  network: string,
  expandedNetworks: Record<string, boolean>,
) {
  if (network in expandedNetworks) {
    return Boolean(expandedNetworks[network]);
  }
  return defaultNetworkExpanded(network);
}

/**
 * Expand/collapse state for chain sections on balances and token pickers.
 */
export function useExpandedNetworks() {
  const [expandedNetworks, setExpandedNetworks] = useState<
    Record<string, boolean>
  >({});

  const isExpanded = useCallback(
    (network: string) => isNetworkExpandedInState(network, expandedNetworks),
    [expandedNetworks],
  );

  const toggleNetwork = useCallback((network: string) => {
    setExpandedNetworks((current) => ({
      ...current,
      [network]: !isNetworkExpandedInState(network, current),
    }));
  }, []);

  return { expandedNetworks, isExpanded, toggleNetwork };
}
