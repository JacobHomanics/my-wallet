/** Matches Convex `REWARD_TOKEN_ADDRESS` default in `convex/lib/treasuryReward.ts`. */
const DEFAULT_REWARD_TOKEN_ADDRESS =
  '0xc534791fecf402c8d68e03d5fc724f710802dfcd';

/** Client-exposed Base reward token contract (EXPO_PUBLIC_*). */
export function getRewardTokenAddress(): string {
  return (
    process.env.EXPO_PUBLIC_REWARD_TOKEN_ADDRESS?.trim() ||
    DEFAULT_REWARD_TOKEN_ADDRESS
  );
}
