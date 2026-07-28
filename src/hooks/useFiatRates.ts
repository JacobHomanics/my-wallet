import { useCallback, useSyncExternalStore } from 'react';

import { FIAT_RATE_CODES } from '@/lib/displayCurrency';

type FiatRatesCache = {
  rates: Record<string, number>;
  fetchedAt: number;
};

type FiatRatesSnapshot = {
  rates: Record<string, number> | null;
  loading: boolean;
  error: string | null;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest';

let ratesCache: FiatRatesCache | null = null;
let fetchPromise: Promise<Record<string, number>> | null = null;

type FrankfurterResponse = {
  rates?: Record<string, number>;
};

type FiatRatesListener = () => void;
const listeners = new Set<FiatRatesListener>();

const initialRates = readFreshCache()?.rates ?? null;

let snapshot: FiatRatesSnapshot = {
  rates: initialRates,
  loading: initialRates == null,
  error: null,
};

function readFreshCache(): FiatRatesCache | null {
  if (
    !ratesCache ||
    Date.now() - ratesCache.fetchedAt > CACHE_TTL_MS
  ) {
    return null;
  }
  return ratesCache;
}

function emit(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: FiatRatesListener): () => void {
  listeners.add(listener);
  ensureRatesLoaded();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FiatRatesSnapshot {
  return snapshot;
}

async function fetchFiatRates(): Promise<Record<string, number>> {
  const fresh = readFreshCache();
  if (fresh) {
    return fresh.rates;
  }

  const to = FIAT_RATE_CODES.join(',');
  const response = await fetch(`${FRANKFURTER_URL}?from=USD&to=${to}`);
  if (!response.ok) {
    throw new Error(`Exchange rate request failed (${response.status})`);
  }

  const json = (await response.json()) as FrankfurterResponse;
  const rates: Record<string, number> = { USD: 1 };
  for (const [code, value] of Object.entries(json.rates ?? {})) {
    if (Number.isFinite(value)) {
      rates[code] = value;
    }
  }

  ratesCache = { rates, fetchedAt: Date.now() };
  return rates;
}

function ensureRatesLoaded(): void {
  if (snapshot.rates != null || fetchPromise != null) {
    return;
  }

  snapshot = { ...snapshot, loading: true, error: null };
  emit();

  fetchPromise = fetchFiatRates()
    .then((rates) => {
      snapshot = { rates, loading: false, error: null };
      emit();
      return rates;
    })
    .catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Failed to load exchange rates';
      snapshot = {
        rates: { USD: 1 },
        loading: false,
        error: message,
      };
      emit();
      throw err;
    })
    .finally(() => {
      fetchPromise = null;
    });
}

/**
 * USD → fiat exchange rates (how many units of fiat per 1 USD).
 */
export function useFiatRates(): {
  loading: boolean;
  error: string | null;
  getUsdToFiatRate: (currencyCode: string) => number;
} {
  const { rates, loading, error } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const getUsdToFiatRate = useCallback(
    (currencyCode: string): number => {
      if (currencyCode === 'USD') {
        return 1;
      }
      const rate = rates?.[currencyCode];
      return rate != null && Number.isFinite(rate) ? rate : 1;
    },
    [rates],
  );

  return {
    loading,
    error,
    getUsdToFiatRate,
  };
}
