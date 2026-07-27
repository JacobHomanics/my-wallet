import { useMemo } from 'react';

import {
  groupOwnedTokensByChain,
  type OwnedToken,
  type TokenChainGroup,
} from '@/lib/alchemy/fetchTokensByAddress';

/**
 * Groups priced token balances into chain sections; unpriced tokens land in "Unknown".
 */
export function useTokensByChain(tokens: OwnedToken[]): TokenChainGroup[] {
  return useMemo(() => groupOwnedTokensByChain(tokens), [tokens]);
}
