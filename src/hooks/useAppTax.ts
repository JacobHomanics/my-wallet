import { useCallback, useMemo } from 'react';

import {
  computePayerTotalUsd,
  computeTaxUsd,
  formatTaxRatePercent,
  getTaxConfig,
  maxMerchantUsdForAvailable,
  resolveTaxRate,
  taxRawFromAmount,
  type TaxConfig,
} from '@/lib/tax';

export type AppTaxResult = TaxConfig & {
  /** Resolved rate for the current gas sponsorship preference. */
  rate: number;
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
  sponsoredRatePercentLabel: string;
  unsponsoredRatePercentLabel: string;
};

/**
 * App-wide tax-on-top config from `src/configs/app.config.ts`.
 * Defaults to the sponsored rate when gas sponsorship is unspecified.
 */
export function useAppTax(gasSponsorship: boolean = true): AppTaxResult {
  const config = useMemo(() => getTaxConfig(), []);
  const rate = useMemo(
    () => resolveTaxRate(gasSponsorship),
    [gasSponsorship],
  );

  const taxUsdFor = useCallback(
    (merchantUsd: number) => computeTaxUsd(merchantUsd, rate),
    [rate],
  );

  const payerTotalUsdFor = useCallback(
    (merchantUsd: number) => computePayerTotalUsd(merchantUsd, rate),
    [rate],
  );

  const maxMerchantUsdFor = useCallback(
    (availableUsd: number) => maxMerchantUsdForAvailable(availableUsd, rate),
    [rate],
  );

  const taxRawFor = useCallback(
    (amountRaw: bigint) => taxRawFromAmount(amountRaw, rate),
    [rate],
  );

  const ratePercentLabel = useMemo(() => formatTaxRatePercent(rate), [rate]);

  const sponsoredRatePercentLabel = useMemo(
    () => formatTaxRatePercent(config.sponsoredRate),
    [config.sponsoredRate],
  );

  const unsponsoredRatePercentLabel = useMemo(
    () => formatTaxRatePercent(config.unsponsoredRate),
    [config.unsponsoredRate],
  );

  return {
    ...config,
    rate,
    taxUsdFor,
    payerTotalUsdFor,
    maxMerchantUsdFor,
    taxRawFor,
    ratePercentLabel,
    sponsoredRatePercentLabel,
    unsponsoredRatePercentLabel,
  };
}
