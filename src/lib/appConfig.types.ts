export type RewardCurveConfig = {
  referenceUsd: number;
  referencePoints: number;
  exponent: number;
  minUsd: number;
};

export type CashbackConfig = {
  pointsPerUsdc: number;
};

export type PublicAppConfig = {
  rewards: RewardCurveConfig;
  cashback: CashbackConfig;
};
