import { useMemo } from 'react';

import { useChainPriority } from '@/hooks/useChainPriority';
import {
  groupOwnedTokensByChain,
  type OwnedToken,
  type TokenChainGroup,
} from '@/lib/alchemy/fetchTokensByAddress';

/**
 * Groups priced token balances into chain sections; unpriced tokens land in "Unknown".
 */
export function useTokensByChain(tokens: OwnedToken[]): TokenChainGroup[] {
  const { selectedChainPriorityId } = useChainPriority();

  return useMemo(
    () => groupOwnedTokensByChain(tokens, selectedChainPriorityId),
    [selectedChainPriorityId, tokens],
  );
}
