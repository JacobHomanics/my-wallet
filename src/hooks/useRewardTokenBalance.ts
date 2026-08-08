import { useMemo } from 'react';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import {
  isRewardToken,
  REWARD_TOKEN_SYMBOL,
} from '@/lib/rewardToken';

export type RewardTokenBalanceResult = {
  /** Whole-token balance string, or `"0"` when missing / zero. */
  balanceFormatted: string;
  symbol: typeof REWARD_TOKEN_SYMBOL;
  loading: boolean;
  ready: boolean;
};

/**
 * User's CashBox Points balance from the Base reward token via Alchemy.
 */
export function useRewardTokenBalance(): RewardTokenBalanceResult {
  const { tokens, loading, ready } = useTokenBalances();

  const balanceFormatted = useMemo(() => {
    const match = tokens.find((token) =>
      isRewardToken(token.network, token.tokenAddress),
    );
    return match?.balanceFormatted ?? '0';
  }, [tokens]);

  return {
    balanceFormatted,
    symbol: REWARD_TOKEN_SYMBOL,
    loading,
    ready,
  };
}
