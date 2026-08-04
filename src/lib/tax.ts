import { appConfig } from '@/configs/app.config';

/** Basis points scale: 10_000 bps = 100%. */
const BPS_SCALE = 10_000n;

export type TaxConfig = {
  /** Fraction of the merchant payment added on top (0.01 = 1%). */
  rate: number;
  evmAddress: string;
  solanaAddress: string;
};

/** App-wide tax wallets + rate from `src/configs/app.config.ts`. */
export function getTaxConfig(): TaxConfig {
  return {
    rate: appConfig.tax.rate,
    evmAddress: appConfig.tax.evmAddress,
    solanaAddress: appConfig.tax.solanaAddress,
  };
}

/** Rate as integer basis points (1% → 100). */
export function taxRateToBps(rate: number): bigint {
  if (!(rate > 0) || !Number.isFinite(rate)) {
    return 0n;
  }
  return BigInt(Math.round(rate * Number(BPS_SCALE)));
}

/** Tax USD added on top of a merchant payment. */
export function computeTaxUsd(
  merchantUsd: number,
  rate: number = getTaxConfig().rate,
): number {
  if (!(merchantUsd > 0) || !(rate > 0)) {
    return 0;
  }
  return merchantUsd * rate;
}

/** Payer total = merchant + tax. */
export function computePayerTotalUsd(
  merchantUsd: number,
  rate: number = getTaxConfig().rate,
): number {
  if (!(merchantUsd > 0)) {
    return 0;
  }
  return merchantUsd + computeTaxUsd(merchantUsd, rate);
}

/**
 * Max merchant USD that still fits under `availableUsd` after tax-on-top.
 * `available / (1 + rate)`.
 */
export function maxMerchantUsdForAvailable(
  availableUsd: number,
  rate: number = getTaxConfig().rate,
): number {
  if (!(availableUsd > 0)) {
    return 0;
  }
  if (!(rate > 0)) {
    return availableUsd;
  }
  return availableUsd / (1 + rate);
}

/** Integer tax amount from a merchant raw transfer (floor). */
export function taxRawFromAmount(
  amountRaw: bigint,
  rate: number = getTaxConfig().rate,
): bigint {
  if (amountRaw <= 0n) {
    return 0n;
  }
  const bps = taxRateToBps(rate);
  if (bps <= 0n) {
    return 0n;
  }
  return (amountRaw * bps) / BPS_SCALE;
}
