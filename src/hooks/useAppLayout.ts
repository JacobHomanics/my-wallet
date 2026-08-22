import { useCallback, useSyncExternalStore } from 'react';

import {
  APP_LAYOUT_OPTIONS,
  DEFAULT_APP_LAYOUT_ID,
  getAppLayoutOption,
  type AppLayoutId,
  type AppLayoutOption,
} from '@/lib/appLayout';

type AppLayoutListener = () => void;

type AppLayoutSnapshot = {
  selectedAppLayoutId: AppLayoutId;
  hasBeenSet: boolean;
};

const APP_LAYOUT_STORAGE_KEY = 'appLayoutId';

function normalizeStoredAppLayoutId(stored: string): AppLayoutId | null {
  if (getAppLayoutOption(stored as AppLayoutId)) {
    return stored as AppLayoutId;
  }
  return null;
}

function readStoredAppLayoutId(): AppLayoutId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(APP_LAYOUT_STORAGE_KEY);
    if (stored) {
      return normalizeStoredAppLayoutId(stored);
    }
  } catch {
    // Ignore quota / private-mode storage errors.
  }

  return null;
}

function persistAppLayoutId(id: AppLayoutId): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(APP_LAYOUT_STORAGE_KEY, id);
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

const storedAppLayoutId = readStoredAppLayoutId();
let snapshot: AppLayoutSnapshot = {
  selectedAppLayoutId: storedAppLayoutId ?? DEFAULT_APP_LAYOUT_ID,
  hasBeenSet: storedAppLayoutId != null,
};
const listeners = new Set<AppLayoutListener>();

function subscribe(listener: AppLayoutListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppLayoutSnapshot {
  return snapshot;
}

export function getAppLayoutId(): AppLayoutId {
  return getSnapshot().selectedAppLayoutId;
}

function setSelectedAppLayoutId(id: AppLayoutId): void {
  if (id === snapshot.selectedAppLayoutId && snapshot.hasBeenSet) {
    return;
  }
  snapshot = {
    selectedAppLayoutId: id,
    hasBeenSet: true,
  };
  persistAppLayoutId(id);
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * User preference for Default vs Advanced (Money on Steroids) app layout.
 * `hasAppLayoutBeenSet` is false until the user explicitly chooses one.
 */
export function useAppLayout(): {
  options: readonly AppLayoutOption[];
  selectedAppLayoutId: AppLayoutId;
  selectedLayout: AppLayoutOption;
  isAdvanced: boolean;
  hasAppLayoutBeenSet: boolean;
  setAppLayout: (id: AppLayoutId) => void;
} {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const setAppLayout = useCallback((id: AppLayoutId) => {
    setSelectedAppLayoutId(id);
  }, []);

  const selectedLayout =
    getAppLayoutOption(current.selectedAppLayoutId) ??
    getAppLayoutOption(DEFAULT_APP_LAYOUT_ID)!;

  return {
    options: APP_LAYOUT_OPTIONS,
    selectedAppLayoutId: selectedLayout.id,
    selectedLayout,
    isAdvanced: selectedLayout.id === 'advanced',
    hasAppLayoutBeenSet: current.hasBeenSet,
    setAppLayout,
  };
}
