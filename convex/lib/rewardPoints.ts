import { appConfig } from "../config/app.config";

/** Allow minor USD drift from token allocation rounding (see allocatePayment). */
const REWARD_USD_TOLERANCE = 0.005;

/** Whole CashBox Points earned for a merchant payment USD amount. */
export function calculateRewardPoints(paymentUsd: number): number {
  const { referenceUsd, referencePoints, exponent, minUsd } = appConfig.rewards;

  if (
    !Number.isFinite(paymentUsd) ||
    paymentUsd + REWARD_USD_TOLERANCE < minUsd
  ) {
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
