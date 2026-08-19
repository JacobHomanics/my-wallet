export type RewardCurveConfig = {
  referenceUsd: number;
  referencePoints: number;
  exponent: number;
  minUsd: number;
};

export type CashbackConfig = {
  pointsPerUsdc: number;
};

export type TaxConfig = {
  /** Fraction of merchant payment when gas is sponsored (0.01 = 1%). */
  sponsoredRate: number;
  /** Fraction of merchant payment when the payer covers gas (0.005 = 0.5%). */
  unsponsoredRate: number;
  evmAddress: string;
  solanaAddress: string;
};

export type PublicAppConfig = {
  gasSponsorship: boolean;
  tax: TaxConfig;
  rewards: RewardCurveConfig;
  cashback: CashbackConfig;
};
