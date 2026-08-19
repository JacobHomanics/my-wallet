import type { RewardCurveConfig } from '@/lib/appConfig.types';
import { isUnpricedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

/**
 * Whole CashBox Points earned for a merchant payment USD amount.
 * `floor(referencePoints * (paymentUsd / referenceUsd) ^ exponent)`
 */
export function calculateRewardPoints(
  paymentUsd: number,
  config: RewardCurveConfig,
): number {
  const { referenceUsd, referencePoints, exponent, minUsd } = config;

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

/** Sum priced merchant allocation USD (excludes unpriced bonus tokens). */
export function computeRewardPaymentUsd(
  allocations: readonly PaymentAllocation[],
): number {
  return allocations
    .filter((allocation) => !isUnpricedToken(allocation.token))
    .reduce((sum, allocation) => sum + allocation.usd, 0);
}

export function formatRewardCurveExamples(config: RewardCurveConfig): string {
  const { referenceUsd, referencePoints } = config;
  const doubleUsd = referenceUsd * 2;
  const doublePoints = calculateRewardPoints(doubleUsd, config);
  return `$${referenceUsd} → ${referencePoints} pts, $${doubleUsd} → ${doublePoints} pts`;
}
