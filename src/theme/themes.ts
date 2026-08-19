import type { ColorThemeId, ColorThemeOption, ThemeColors } from '@/theme/types';

/** Soft mint surfaces with deep forest primary actions. */
export const pestoTheme: ThemeColors = {
  bg: '#f0fdf4',
  surface: '#ffffff',
  surfaceMuted: '#dcfce7',
  border: '#bbf7d0',
  borderStrong: '#86efac',
  inputBorder: '#86d4a4',
  rowBorder: '#d1fae5',
  surfaceHighlight: '#ecfdf5',

  text: '#14532d',
  textSecondary: '#3f6b52',
  textMuted: '#5a7d6a',
  textSubtle: '#86a894',

  primary: '#166534',
  primaryText: '#f0fdf4',
  primaryOverlay: 'rgba(22, 101, 52, 0.45)',

  danger: '#b91c1c',
  dangerBorder: '#fca5a5',
  success: '#15803d',
};

/** Warm cream surfaces with tomato primary actions. */
export const marinaraTheme: ThemeColors = {
  bg: '#FFF4E6',
  surface: '#ffffff',
  surfaceMuted: '#FFDCC8',
  border: '#F5BFA9',
  borderStrong: '#F19C7E',
  inputBorder: '#F3A089',
  rowBorder: '#F5BFA9',
  surfaceHighlight: '#FFF0E0',

  text: '#4A1E1E',
  textSecondary: '#7A3B3B',
  textMuted: '#9B5A5A',
  textSubtle: '#C37A7A',

  primary: '#D33D3D',
  primaryText: '#FFF4E6',
  primaryOverlay: 'rgba(211, 61, 61, 0.45)',

  danger: '#b91c1c',
  dangerBorder: '#fca5a5',
  success: '#15803d',
};

export const COLOR_THEMES: Record<ColorThemeId, ThemeColors> = {
  pesto: pestoTheme,
  marinara: marinaraTheme,
};

export const DEFAULT_COLOR_THEME_ID: ColorThemeId = 'pesto';

export const COLOR_THEME_OPTIONS: readonly ColorThemeOption[] = [
  {
    id: 'pesto',
    label: 'Pesto',
    description: 'Light green mint surfaces with forest accents',
  },
  {
    id: 'marinara',
    label: 'Marinara',
    description: 'Warm cream surfaces with tomato red accents',
  },
] as const;

export function getColorThemeOption(id: ColorThemeId): ColorThemeOption | undefined {
  return COLOR_THEME_OPTIONS.find((option) => option.id === id);
}

export function getColorThemeColors(id: ColorThemeId): ThemeColors {
  return COLOR_THEMES[id];
}
