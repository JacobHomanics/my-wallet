export const appConfig = {
  brand: {
    rewardPointsLabel: "Cashbox Points",
  },
  /** When true, Privy pays network fees on supported chains (backend sends only). When false, users cannot enable gas sponsorship. */
  gasSponsorship: false,
  tax: {
    /** Service fee when gas sponsorship is on (fraction of merchant payment). */
    sponsoredRate: 0.01,
    /** Service fee when the payer covers network fees (fraction of merchant payment). */
    unsponsoredRate: 0.0005,
    evmAddress: "0xe80A48BcA9552d5DC6567841CdD5d0F870C4b98B",
    solanaAddress: "7VrowyBktQbGiiZuL3cb2DZAVtGWCyDonT2BUcCAz7Ve",
  },
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
