import { useCallback, useMemo } from 'react';

import {
  computePayerTotalUsd,
  computeTaxUsd,
  getTaxConfig,
  maxMerchantUsdForAvailable,
  taxRawFromAmount,
  type TaxConfig,
} from '@/lib/tax';

export type AppTaxResult = TaxConfig & {
  /** Tax USD for a merchant payment amount. */
  taxUsdFor: (merchantUsd: number) => number;
  /** Merchant + tax USD. */
  payerTotalUsdFor: (merchantUsd: number) => number;
  /** Max merchant USD that fits under available after tax. */
  maxMerchantUsdFor: (availableUsd: number) => number;
  /** Tax raw units for a merchant transfer amount. */
  taxRawFor: (amountRaw: bigint) => bigint;
  /** Percent label for UI, e.g. "1". */
  ratePercentLabel: string;
};

/**
 * App-wide tax-on-top config from `src/configs/app.config.ts`.
 */
export function useAppTax(): AppTaxResult {
  const config = useMemo(() => getTaxConfig(), []);

  const taxUsdFor = useCallback(
    (merchantUsd: number) => computeTaxUsd(merchantUsd, config.rate),
    [config.rate],
  );

  const payerTotalUsdFor = useCallback(
    (merchantUsd: number) => computePayerTotalUsd(merchantUsd, config.rate),
    [config.rate],
  );

  const maxMerchantUsdFor = useCallback(
    (availableUsd: number) =>
      maxMerchantUsdForAvailable(availableUsd, config.rate),
    [config.rate],
  );

  const taxRawFor = useCallback(
    (amountRaw: bigint) => taxRawFromAmount(amountRaw, config.rate),
    [config.rate],
  );

  const ratePercentLabel = useMemo(() => {
    const pct = config.rate * 100;
    return Number.isInteger(pct) ? String(pct) : pct.toFixed(2);
  }, [config.rate]);

  return {
    ...config,
    taxUsdFor,
    payerTotalUsdFor,
    maxMerchantUsdFor,
    taxRawFor,
    ratePercentLabel,
  };
}
