import { getRewardTokenAddress } from '@/lib/rewardTokenCredentials';

/** Base mainnet reward token. Matches Convex `REWARD_TOKEN_ADDRESS` default. */
export const REWARD_TOKEN_NETWORK = 'base-mainnet' as const;
export const REWARD_TOKEN_ADDRESS = getRewardTokenAddress();
/** On-chain / token icon symbol. */
export const REWARD_TOKEN_SYMBOL = 'CBR' as const;
/** User-facing name for reward balance and earn copy. */
export const REWARD_POINTS_LABEL = 'CashBox Points' as const;
export const REWARD_TOKEN_NAME = REWARD_POINTS_LABEL;

export function isRewardToken(
  network: string,
  tokenAddress: string | null | undefined,
): boolean {
  if (!tokenAddress) {
    return false;
  }
  return (
    network === REWARD_TOKEN_NETWORK &&
    tokenAddress.trim().toLowerCase() === REWARD_TOKEN_ADDRESS.toLowerCase()
  );
}
