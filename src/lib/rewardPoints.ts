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

  if (
    !Number.isFinite(paymentUsd) ||
    paymentUsd + 0.005 < config.minUsd
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

/** Sum priced merchant allocation USD (excludes unpriced bonus tokens). */
export function computeRewardPaymentUsd(
  allocations: readonly PaymentAllocation[],
): number {
  return allocations
    .filter((allocation) => !isUnpricedToken(allocation.token))
    .reduce((sum, allocation) => sum + allocation.usd, 0);
}

/**
 * Merchant USD amount used for rewards — prefers the entered payment over
 * allocation sums, which can round slightly below the user's amount.
 */
export function resolveRewardPaymentUsd(params: {
  baseUsd: number | null;
  filledUsd: number;
  allocations: readonly PaymentAllocation[];
}): number {
  const fromAllocations = computeRewardPaymentUsd(params.allocations);
  const fromIntent =
    params.baseUsd != null && params.baseUsd > 0
      ? params.baseUsd
      : params.filledUsd > 0
        ? params.filledUsd
        : 0;

  return Math.max(fromIntent, fromAllocations);
}

export function formatRewardCurveExamples(config: RewardCurveConfig): string {
  const { referenceUsd, referencePoints } = config;
  const doubleUsd = referenceUsd * 2;
  const doublePoints = calculateRewardPoints(doubleUsd, config);
  return `$${referenceUsd} → ${referencePoints} pts, $${doubleUsd} → ${doublePoints} pts`;
}
