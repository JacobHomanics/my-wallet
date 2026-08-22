import { useCallback, useSyncExternalStore } from 'react';

import {
  ADVANCED_LAYOUT_SECTIONS,
  createDefaultAdvancedLayoutSections,
  type AdvancedLayoutSectionId,
  type AdvancedLayoutSectionOption,
} from '@/lib/advancedLayoutSections';

type AdvancedLayoutSectionsListener = () => void;

const ADVANCED_LAYOUT_SECTIONS_STORAGE_KEY = 'advancedLayoutSections';

function normalizeStoredSections(
  value: unknown,
): Record<AdvancedLayoutSectionId, boolean> {
  const next = createDefaultAdvancedLayoutSections();
  if (value == null || typeof value !== 'object') {
    return next;
  }

  const record = value as Record<string, unknown>;
  for (const option of ADVANCED_LAYOUT_SECTIONS) {
    const stored = record[option.id];
    if (typeof stored === 'boolean') {
      next[option.id] = stored;
    }
  }
  return next;
}

function readStoredSections(): Record<AdvancedLayoutSectionId, boolean> {
  if (typeof window === 'undefined') {
    return createDefaultAdvancedLayoutSections();
  }

  try {
    const stored = window.localStorage.getItem(
      ADVANCED_LAYOUT_SECTIONS_STORAGE_KEY,
    );
    if (stored) {
      return normalizeStoredSections(JSON.parse(stored) as unknown);
    }
  } catch {
    // Ignore quota / private-mode / parse errors.
  }

  return createDefaultAdvancedLayoutSections();
}

function persistSections(
  sections: Record<AdvancedLayoutSectionId, boolean>,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      ADVANCED_LAYOUT_SECTIONS_STORAGE_KEY,
      JSON.stringify(sections),
    );
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

let snapshot = readStoredSections();
const listeners = new Set<AdvancedLayoutSectionsListener>();

function subscribe(listener: AdvancedLayoutSectionsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Record<AdvancedLayoutSectionId, boolean> {
  return snapshot;
}

function setSectionEnabled(
  id: AdvancedLayoutSectionId,
  enabled: boolean,
): void {
  if (snapshot[id] === enabled) {
    return;
  }

  snapshot = {
    ...snapshot,
    [id]: enabled,
  };
  persistSections(snapshot);
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * Per-section Advanced layout preferences. Only applied while Advanced layout
 * is selected; Default layout ignores these flags.
 */
export function useAdvancedLayoutSections(): {
  options: readonly AdvancedLayoutSectionOption[];
  enabledById: Record<AdvancedLayoutSectionId, boolean>;
  setSectionEnabled: (
    id: AdvancedLayoutSectionId,
    enabled: boolean,
  ) => void;
} {
  const enabledById = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const setEnabled = useCallback(
    (id: AdvancedLayoutSectionId, enabled: boolean) => {
      setSectionEnabled(id, enabled);
    },
    [],
  );

  return {
    options: ADVANCED_LAYOUT_SECTIONS,
    enabledById,
    setSectionEnabled: setEnabled,
  };
}
