import { appConfig } from "../config/app.config";

/** Whole CashBox Points earned for a merchant payment USD amount. */
export function calculateRewardPoints(paymentUsd: number): number {
  const { referenceUsd, referencePoints, exponent, minUsd } = appConfig.rewards;

  if (!Number.isFinite(paymentUsd) || paymentUsd < minUsd) {
    return 0;
  }

  const ratio = paymentUsd / referenceUsd;
  const points = referencePoints * ratio ** exponent;
  if (!Number.isFinite(points) || points <= 0) {
    return 0;
  }

  return Math.floor(points);
}

export function getRewardCurveConfig() {
  return appConfig.rewards;
}
