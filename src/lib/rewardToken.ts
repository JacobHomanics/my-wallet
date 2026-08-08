/** Base mainnet reward token (CBR). Matches Convex `REWARD_TOKEN_ADDRESS` default. */
export const REWARD_TOKEN_NETWORK = 'base-mainnet' as const;
export const REWARD_TOKEN_ADDRESS =
  '0x4ed932ac83f77a5d4f3d950ab9ba90882ed06e55' as const;
export const REWARD_TOKEN_SYMBOL = 'CBR' as const;
export const REWARD_TOKEN_NAME = 'Cashbox Rewards' as const;

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
