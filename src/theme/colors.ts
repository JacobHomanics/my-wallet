/**
 * Cashbox light-green palette.
 * Soft mint surfaces with deep forest primary actions.
 */
export const colors = {
  bg: '#f0fdf4',
  surface: '#ffffff',
  surfaceMuted: '#dcfce7',
  border: '#bbf7d0',
  borderStrong: '#86efac',
  inputBorder: '#86d4a4',

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
} as const;

export type ThemeColors = typeof colors;
