/** Formats a fiat amount with the currency symbol (e.g. $1,234.56). */
export function formatFiatValue(
  value: number | null,
  currencyCode: string,
): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const fractionDigits =
    currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : value >= 1000 ? 0 : 2;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    return null;
  }
}

/** Formats a fiat number for amount inputs (no currency symbol). */
export function formatFiatAmountInput(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '0';
  }
  if (value === 0) {
    return '0';
  }
  const fixed = value.toFixed(6).replace(/\.?0+$/, '');
  return fixed === '' ? '0' : fixed;
}

/** Parses a decimal amount input string into a number, or null. */
export function parseFiatInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '.' || trimmed.startsWith('-')) {
    return null;
  }
  if (!/^\d+(\.\d*)?$/.test(trimmed) && !/^\.\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Currency symbol for compact prefixes (e.g. $, €). */
export function getCurrencySymbol(currencyCode: string): string {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(0);
    const symbol = parts.find((part) => part.type === 'currency')?.value;
    return symbol ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

export function convertUsdToFiat(usd: number, usdToFiatRate: number): number {
  return usd * usdToFiatRate;
}

export function convertFiatToUsd(fiat: number, usdToFiatRate: number): number {
  if (usdToFiatRate === 0) {
    return 0;
  }
  return fiat / usdToFiatRate;
}
