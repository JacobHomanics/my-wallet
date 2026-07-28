import { useCallback, useMemo } from 'react';

import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useFiatRates } from '@/hooks/useFiatRates';
import {
  convertFiatToUsd,
  convertUsdToFiat,
  formatFiatAmountInput,
  formatFiatValue,
  getCurrencySymbol,
  parseFiatInput,
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
    formatAmountInputFromUsd,
    formatAmountInput: formatFiatAmountInput,
    parseDisplayInputToUsd,
    defaultFormattedZero,
  };
}
