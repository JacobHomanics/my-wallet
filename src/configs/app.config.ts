export const appConfig = {
  /** When true, Privy pays network fees on supported chains (backend sends only). When false, users cannot enable gas sponsorship. */
  gasSponsorship: false,
  cashback: {
    /** Whole CashBox Points redeemed per 1 USDC (100 points → $1). Keep in sync with Convex `CASHBACK_POINTS_PER_USDC`. */
    pointsPerUsdc: 200,
  },
  tax: {
    /** Service fee when gas sponsorship is on (fraction of merchant payment). */
    sponsoredRate: 0.01,
    /** Service fee when the payer covers network fees (fraction of merchant payment). */
    unsponsoredRate: 0.005,
    evmAddress: '0xe80A48BcA9552d5DC6567841CdD5d0F870C4b98B',
    solanaAddress: '7VrowyBktQbGiiZuL3cb2DZAVtGWCyDonT2BUcCAz7Ve',
  },
} as const;
