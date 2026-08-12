import { useCallback, useSyncExternalStore } from 'react';

import {
  DEFAULT_DISPLAY_CURRENCY_ID,
  DISPLAY_CURRENCY_OPTIONS,
  getDisplayCurrencyOption,
  type DisplayCurrencyId,
  type DisplayCurrencyOption,
} from '@/lib/displayCurrency';

type DisplayCurrencyListener = () => void;
type DisplayCurrencyChangeListener = () => void;

const DISPLAY_CURRENCY_STORAGE_KEY = 'displayCurrencyId';

function readStoredDisplayCurrencyId(): DisplayCurrencyId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
    if (stored && getDisplayCurrencyOption(stored as DisplayCurrencyId)) {
      return stored as DisplayCurrencyId;
    }
  } catch {
    // Ignore quota / private-mode storage errors.
  }

  return null;
}

function persistDisplayCurrencyId(id: DisplayCurrencyId): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, id);
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

let selectedDisplayCurrencyId: DisplayCurrencyId =
  readStoredDisplayCurrencyId() ?? DEFAULT_DISPLAY_CURRENCY_ID;
const listeners = new Set<DisplayCurrencyListener>();
const changeListeners = new Set<DisplayCurrencyChangeListener>();

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

/** Notifies when the user picks a new display currency in settings. */
export function registerDisplayCurrencyChangeListener(
  listener: DisplayCurrencyChangeListener,
): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

function setSelectedDisplayCurrencyId(id: DisplayCurrencyId): void {
  if (id === selectedDisplayCurrencyId) {
    return;
  }
  selectedDisplayCurrencyId = id;
  persistDisplayCurrencyId(id);
  listeners.forEach((listener) => {
    listener();
  });
  changeListeners.forEach((listener) => {
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
