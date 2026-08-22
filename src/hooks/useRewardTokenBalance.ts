import { useMemo } from 'react';

import { useRewardsPreview } from '@/hooks/useRewardsPreview';
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
  error: string | null;
  isPreview: boolean;
};

/**
 * User's CashBox Points balance from the Base reward token via Alchemy.
 */
export function useRewardTokenBalance(): RewardTokenBalanceResult {
  const { isPreview, balanceFormatted: previewBalance } = useRewardsPreview();
  const { tokens, loading, ready, error } = useTokenBalances();

  const balanceFormatted = useMemo(() => {
    if (isPreview) {
      return previewBalance;
    }
    const match = tokens.find((token) =>
      isRewardToken(token.network, token.tokenAddress),
    );
    return match?.balanceFormatted ?? '0';
  }, [isPreview, previewBalance, tokens]);

  return {
    balanceFormatted,
    symbol: REWARD_TOKEN_SYMBOL,
    loading: isPreview ? false : loading,
    ready: isPreview || ready,
    error: isPreview ? null : error,
    isPreview,
  };
}
