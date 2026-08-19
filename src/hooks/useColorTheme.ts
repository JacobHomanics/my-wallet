import { useCallback, useSyncExternalStore } from 'react';

import {
  COLOR_THEME_OPTIONS,
  DEFAULT_COLOR_THEME_ID,
  getColorThemeColors,
  getColorThemeOption,
} from '@/theme/themes';
import type { ColorThemeId, ColorThemeOption, ThemeColors } from '@/theme/types';

type ColorThemeListener = () => void;

const COLOR_THEME_STORAGE_KEY = 'colorThemeId';

function readStoredColorThemeId(): ColorThemeId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (stored && getColorThemeOption(stored as ColorThemeId)) {
      return stored as ColorThemeId;
    }
  } catch {
    // Ignore quota / private-mode storage errors.
  }

  return null;
}

function persistColorThemeId(id: ColorThemeId): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, id);
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

function applyWebThemeMeta(colors: ThemeColors): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.backgroundColor = colors.bg;
  document.body.style.backgroundColor = colors.bg;

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', colors.bg);
  }
}

let selectedColorThemeId: ColorThemeId =
  readStoredColorThemeId() ?? DEFAULT_COLOR_THEME_ID;
const listeners = new Set<ColorThemeListener>();

function subscribe(listener: ColorThemeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ColorThemeId {
  return selectedColorThemeId;
}

export function getColorThemeId(): ColorThemeId {
  return getSnapshot();
}

export function getThemeColorsSnapshot(): ThemeColors {
  return getColorThemeColors(getSnapshot());
}

function setSelectedColorThemeId(id: ColorThemeId): void {
  if (id === selectedColorThemeId) {
    return;
  }
  selectedColorThemeId = id;
  persistColorThemeId(id);
  applyWebThemeMeta(getColorThemeColors(id));
  listeners.forEach((listener) => {
    listener();
  });
}

applyWebThemeMeta(getThemeColorsSnapshot());

/**
 * User preference for the app color theme (pesto or marinara).
 */
export function useColorTheme(): {
  options: readonly ColorThemeOption[];
  selectedColorThemeId: ColorThemeId;
  selectedTheme: ColorThemeOption;
  colors: ThemeColors;
  setColorTheme: (id: ColorThemeId) => void;
} {
  const selectedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const setColorTheme = useCallback((id: ColorThemeId) => {
    setSelectedColorThemeId(id);
  }, []);

  const selectedTheme =
    getColorThemeOption(selectedId) ??
    getColorThemeOption(DEFAULT_COLOR_THEME_ID)!;

  return {
    options: COLOR_THEME_OPTIONS,
    selectedColorThemeId: selectedTheme.id,
    selectedTheme,
    colors: getColorThemeColors(selectedTheme.id),
    setColorTheme,
  };
}
