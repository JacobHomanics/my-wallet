import { useMemo } from 'react';

import { APP_NETWORK_DEFINITIONS } from '@/lib/alchemy/networkDefinitions';

export type SupportedChain = {
  id: string;
  label: string;
  chain: 'ethereum' | 'solana';
  nativeSymbol: string;
  gasSponsorship: boolean;
};

/**
 * Production networks the app queries for balances, sends, and history.
 */
export function useSupportedChains(): {
  chains: SupportedChain[];
  evmChains: SupportedChain[];
  solanaChains: SupportedChain[];
  count: number;
} {
  return useMemo(() => {
    const chains = APP_NETWORK_DEFINITIONS.filter((def) => def.portfolio)
      .map(
        (def): SupportedChain => ({
          id: def.id,
          label: def.label,
          chain: def.chain,
          nativeSymbol: def.native.symbol,
          gasSponsorship: def.gasSponsorship,
        }),
      )
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      chains,
      evmChains: chains.filter((chain) => chain.chain === 'ethereum'),
      solanaChains: chains.filter((chain) => chain.chain === 'solana'),
      count: chains.length,
    };
  }, []);
}
