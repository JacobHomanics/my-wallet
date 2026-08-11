/**
 * Marinara “pasta” palette.
 * Warm cream surfaces with tomato primary actions.
 */
export const colors = {
  bg: '#FFF4E6',
  surface: '#ffffff',
  surfaceMuted: '#FFDCC8',
  border: '#F5BFA9',
  borderStrong: '#F19C7E',
  inputBorder: '#F3A089',

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
} as const;

export type ThemeColors = typeof colors;
