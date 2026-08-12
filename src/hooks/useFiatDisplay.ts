import { useCallback, useMemo } from 'react';

import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useFiatRates } from '@/hooks/useFiatRates';
import {
  convertFiatToUsd,
  convertUsdToFiat,
  formatFiatAmountInput,
  formatFiatValue,
  formatFiatValueWithDigits,
  formatServiceFeeAmountInput,
  getCurrencySymbol,
  parseFiatInput,
  serviceFeeFractionDigits,
} from '@/lib/fiat';

/**
 * Formats and converts USD-denominated values into the user's display currency.
 */
export function useFiatDisplay() {
  const { selectedCurrency, selectedDisplayCurrencyId } = useDisplayCurrency();
  const { getUsdToFiatRate, loading: ratesLoading, error: ratesError } =
    useFiatRates();

  const currencyCode = selectedCurrency.code;
  const rate = getUsdToFiatRate(currencyCode);
  const currencySymbol = useMemo(
    () => getCurrencySymbol(currencyCode),
    [currencyCode],
  );

  const convertFromUsd = useCallback(
    (usd: number | null): number | null => {
      if (usd == null || !Number.isFinite(usd)) {
        return null;
      }
      return convertUsdToFiat(usd, rate);
    },
    [rate],
  );

  const convertToUsd = useCallback(
    (display: number): number => {
      return convertFiatToUsd(display, rate);
    },
    [rate],
  );

  const formatFromUsd = useCallback(
    (usd: number | null): string | null => {
      const display = convertFromUsd(usd);
      if (display == null) {
        return null;
      }
      return formatFiatValue(display, currencyCode);
    },
    [convertFromUsd, currencyCode],
  );

  const formatServiceFeeFromUsd = useCallback(
    (usd: number | null): string | null => {
      const display = convertFromUsd(usd);
      if (display == null) {
        return null;
      }
      return formatFiatValueWithDigits(
        display,
        currencyCode,
        serviceFeeFractionDigits(currencyCode),
      );
    },
    [convertFromUsd, currencyCode],
  );

  const formatServiceFeeAmountInputFromUsd = useCallback(
    (usd: number): string => {
      const display = convertFromUsd(usd);
      if (display == null) {
        return '0';
      }
      return formatServiceFeeAmountInput(display, currencyCode);
    },
    [convertFromUsd, currencyCode],
  );

  const formatAmountInputFromUsd = useCallback(
    (usd: number): string => {
      const display = convertFromUsd(usd);
      if (display == null) {
        return '0';
      }
      return formatFiatAmountInput(display);
    },
    [convertFromUsd],
  );

  const parseDisplayInputToUsd = useCallback(
    (input: string): number | null => {
      const parsed = parseFiatInput(input);
      if (parsed == null) {
        return null;
      }
      return convertToUsd(parsed);
    },
    [convertToUsd],
  );

  const defaultFormattedZero =
    formatFiatValue(0, currencyCode) ?? `${currencySymbol}0.00`;

  const defaultServiceFeeFormattedZero =
    formatServiceFeeFromUsd(0) ?? `${currencySymbol}0.0000`;

  const formatSignedFromUsd = useCallback(
    (usd: number): string | null => {
      if (!Number.isFinite(usd)) {
        return null;
      }
      if (usd === 0) {
        return defaultFormattedZero;
      }
      const absolute = formatFromUsd(Math.abs(usd));
      if (!absolute) {
        return null;
      }
      return usd > 0 ? `+${absolute}` : `-${absolute}`;
    },
    [defaultFormattedZero, formatFromUsd],
  );

  return {
    selectedCurrency,
    selectedDisplayCurrencyId,
    currencyCode,
    currencySymbol,
    rate,
    ratesLoading,
    ratesError,
    convertFromUsd,
    convertToUsd,
    formatFromUsd,
    formatServiceFeeFromUsd,
    formatServiceFeeAmountInputFromUsd,
    formatSignedFromUsd,
    formatAmountInputFromUsd,
    formatAmountInput: formatFiatAmountInput,
    parseDisplayInputToUsd,
    defaultFormattedZero,
    defaultServiceFeeFormattedZero,
  };
}
