/** Base mainnet USDC — keep in sync with convex/lib/gasTokens.ts. */
export const CASHBACK_USDC_ADDRESS =
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as const;

export const CASHBACK_USDC_DECIMALS = 6;

/** Default whole CashBox Points redeemed per 1 USDC (100 points → $1). */
export const DEFAULT_CASHBACK_POINTS_PER_USDC = 200;

export function getCashbackPointsPerUsdc(): number {
  const raw = process.env.CASHBACK_POINTS_PER_USDC;
  if (raw == null || raw.trim().length === 0) {
    return DEFAULT_CASHBACK_POINTS_PER_USDC;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("CASHBACK_POINTS_PER_USDC must be a positive number");
  }
  return parsed;
}

/** Whole-token points → USDC raw (6 decimals). */
export function pointsWholeToUsdcRaw(pointsWhole: bigint): bigint {
  const pointsPerUsdc = BigInt(getCashbackPointsPerUsdc());
  if (pointsWhole <= 0n) {
    throw new Error("Enter a valid points amount");
  }
  const usdcRaw = (pointsWhole * 1_000_000n) / pointsPerUsdc;
  if (usdcRaw <= 0n) {
    throw new Error("Amount is too small to redeem for USDC");
  }
  return usdcRaw;
}

export function formatUsdcRaw(usdcRaw: bigint): string {
  const whole = usdcRaw / 1_000_000n;
  const fraction = usdcRaw % 1_000_000n;
  if (fraction === 0n) {
    return whole.toString();
  }
  const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");
  return `${whole}.${fractionText}`;
}

export function parseWholePointsAmount(raw: string): bigint {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Enter a whole number of CashBox Points");
  }
  const amount = BigInt(trimmed);
  if (amount <= 0n) {
    throw new Error("Enter a valid points amount");
  }
  return amount;
}
