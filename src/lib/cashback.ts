import { appConfig } from '@/configs/app.config';

/** Whole CashBox Points redeemed per 1 USDC. */
export function getCashbackPointsPerUsdc(): number {
  return appConfig.cashback.pointsPerUsdc;
}

export function parseWholePointsInput(raw: string): bigint | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const amount = BigInt(trimmed);
  return amount > 0n ? amount : null;
}

/** Whole-token points → USDC display string (6 decimals max). */
export function pointsWholeToUsdcAmount(pointsWhole: bigint): string | null {
  const pointsPerUsdc = BigInt(getCashbackPointsPerUsdc());
  if (pointsWhole <= 0n) {
    return null;
  }
  const usdcRaw = (pointsWhole * 1_000_000n) / pointsPerUsdc;
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

export function formatCashbackRateLabel(): string {
  const rate = getCashbackPointsPerUsdc();
  return `${rate} points = 1 USDC`;
}

export function formatCashbackActionError(message: string): string {
  if (message.includes('Insufficient CashBox Points')) {
    return 'Not enough CashBox Points for this redemption.';
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
