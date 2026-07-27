import { useMemo } from 'react';

import {
  groupOwnedTokensByChain,
  type OwnedToken,
  type TokenChainGroup,
} from '@/lib/alchemy/fetchTokensByAddress';

/**
 * Groups token balances into chain sections (preserves chain sort order).
 */
export function useTokensByChain(tokens: OwnedToken[]): TokenChainGroup[] {
  return useMemo(() => groupOwnedTokensByChain(tokens), [tokens]);
}
