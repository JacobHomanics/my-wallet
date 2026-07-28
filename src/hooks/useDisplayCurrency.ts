import { useCallback, useSyncExternalStore } from 'react';

import {
  DEFAULT_DISPLAY_CURRENCY_ID,
  DISPLAY_CURRENCY_OPTIONS,
  getDisplayCurrencyOption,
  type DisplayCurrencyId,
  type DisplayCurrencyOption,
} from '@/lib/displayCurrency';

type DisplayCurrencyListener = () => void;

let selectedDisplayCurrencyId: DisplayCurrencyId = DEFAULT_DISPLAY_CURRENCY_ID;
const listeners = new Set<DisplayCurrencyListener>();

function subscribe(listener: DisplayCurrencyListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DisplayCurrencyId {
  return selectedDisplayCurrencyId;
}

export function getDisplayCurrencyId(): DisplayCurrencyId {
  return getSnapshot();
}

function setSelectedDisplayCurrencyId(id: DisplayCurrencyId): void {
  if (id === selectedDisplayCurrencyId) {
    return;
  }
  selectedDisplayCurrencyId = id;
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * User preference for which fiat currency balances and amounts are shown in.
 */
export function useDisplayCurrency(): {
  options: readonly DisplayCurrencyOption[];
  selectedDisplayCurrencyId: DisplayCurrencyId;
  selectedCurrency: DisplayCurrencyOption;
  setDisplayCurrency: (id: DisplayCurrencyId) => void;
} {
  const selectedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const setDisplayCurrency = useCallback((id: DisplayCurrencyId) => {
    setSelectedDisplayCurrencyId(id);
  }, []);

  const selectedCurrency =
    getDisplayCurrencyOption(selectedId) ??
    getDisplayCurrencyOption(DEFAULT_DISPLAY_CURRENCY_ID)!;

  return {
    options: DISPLAY_CURRENCY_OPTIONS,
    selectedDisplayCurrencyId: selectedCurrency.id,
    selectedCurrency,
    setDisplayCurrency,
  };
}
