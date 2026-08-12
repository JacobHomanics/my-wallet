/** Formats a fiat amount with the currency symbol (e.g. $1,234.56). */
export function formatFiatValue(
  value: number | null,
  currencyCode: string,
): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const fractionDigits = fiatFractionDigits(currencyCode, value);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits === 0 ? 0 : undefined,
    }).format(value);
  } catch {
    return null;
  }
}

export const SERVICE_FEE_FRACTION_DIGITS = 2;

export function serviceFeeFractionDigits(currencyCode: string): number {
  return currencyCode === 'JPY' || currencyCode === 'KRW'
    ? 0
    : SERVICE_FEE_FRACTION_DIGITS;
}

/** Formats a fiat amount with an explicit fraction digit count. */
export function formatFiatValueWithDigits(
  value: number | null,
  currencyCode: string,
  fractionDigits: number,
): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const digits =
    currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : fractionDigits;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  } catch {
    return null;
  }
}

/** Formats a service fee amount for amount inputs (no currency symbol). */
export function formatServiceFeeAmountInput(
  value: number,
  currencyCode: string,
): string {
  if (!Number.isFinite(value) || value < 0) {
    return '0';
  }
  const digits = serviceFeeFractionDigits(currencyCode);
  if (digits === 0) {
    return String(Math.round(value));
  }
  return value.toFixed(digits);
}

function fiatFractionDigits(currencyCode: string, value: number): number {
  return currencyCode === 'JPY' || currencyCode === 'KRW'
    ? 0
    : value >= 1000
      ? 0
      : 2;
}

/**
 * Floors a USD balance to a display-currency amount the user can type and send.
 * Prevents Available Balance from rounding up (e.g. $0.137 → "$0.14") and then
 * failing when that displayed max is entered.
 */
export function floorUsdToSendableCap(
  usd: number,
  usdToFiatRate: number,
  currencyCode: string,
): { sendableUsd: number; displayFiat: number } {
  if (!(usd > 0) || !Number.isFinite(usd) || !(usdToFiatRate > 0)) {
    return { sendableUsd: 0, displayFiat: 0 };
  }

  const fiat = convertUsdToFiat(usd, usdToFiatRate);
  const digits = fiatFractionDigits(currencyCode, fiat);
  const factor = 10 ** digits;
  const displayFiat = Math.floor(fiat * factor + 1e-10) / factor;
  if (displayFiat <= 0) {
    return { sendableUsd: 0, displayFiat: 0 };
  }

  return {
    displayFiat,
    sendableUsd: convertFiatToUsd(displayFiat, usdToFiatRate),
  };
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
