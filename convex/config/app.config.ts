export const appConfig = {
  /** When true, Privy pays gas on backend-initiated wallet sends (e.g. points redemption). */
  gasSponsorship: false,
  rewards: {
    /** USD payment that earns `referencePoints` at the base rate ($5 → 10 pts). */
    referenceUsd: 5,
    referencePoints: 10,
    /** Superlinear exponent — $10 → 25 pts with defaults. */
    exponent: 1.322,
    /** Minimum merchant payment USD to earn any points. */
    minUsd: 1,
  },
  cashback: {
    /** Whole CashBox Points redeemed per 1 USDC (200 points → $1). */
    pointsPerUsdc: 200,
  },
} as const;

export type RewardCurveConfig = typeof appConfig.rewards;
