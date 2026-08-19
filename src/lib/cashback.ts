import { REWARD_POINTS_LABEL } from '@/lib/brand';

export function parseWholePointsInput(raw: string): bigint | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const amount = BigInt(trimmed);
  return amount > 0n ? amount : null;
}

/** Whole-token points → USDC display string (6 decimals max). */
export function pointsWholeToUsdcAmount(
  pointsWhole: bigint,
  pointsPerUsdc: number,
): string | null {
  if (pointsWhole <= 0n || !(pointsPerUsdc > 0)) {
    return null;
  }
  const rate = BigInt(pointsPerUsdc);
  const usdcRaw = (pointsWhole * 1_000_000n) / rate;
  if (usdcRaw <= 0n) {
    return null;
  }
  const whole = usdcRaw / 1_000_000n;
  const fraction = usdcRaw % 1_000_000n;
  if (fraction === 0n) {
    return whole.toString();
  }
  const fractionText = fraction.toString().padStart(6, '0').replace(/0+$/, '');
  return `${whole}.${fractionText}`;
}

export function formatCashbackRateLabel(
  pointsPerUsdc: number,
  formattedUnitAmount: string,
): string {
  return `${pointsPerUsdc} points = ${formattedUnitAmount}`;
}

export function formatCashbackActionError(message: string): string {
  if (message.includes('Gas sponsorship is not enabled')) {
    return 'Redemption requires a small amount of ETH on Base for network fees.';
  }
  if (message.includes('Insufficient') && message.includes('Points')) {
    return `Not enough ${REWARD_POINTS_LABEL} for this redemption.`;
  }
  if (message.includes('Insufficient cashback USDC balance')) {
    return 'Cashback is temporarily unavailable. Please try again later.';
  }
  if (message.includes('too small to redeem')) {
    return 'Amount is too small to redeem for USDC.';
  }
  if (message.includes('whole number')) {
    return 'Enter a whole number of points.';
  }
  return message;
}
