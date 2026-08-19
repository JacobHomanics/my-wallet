export type ThemeColors = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  inputBorder: string;
  rowBorder: string;
  surfaceHighlight: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;

  primary: string;
  primaryText: string;
  primaryOverlay: string;

  danger: string;
  dangerBorder: string;
  success: string;
};

export type ColorThemeId = 'pesto' | 'marinara' | 'mixed' | 'mixedReverse';

export type ColorThemeOption = {
  id: ColorThemeId;
  label: string;
  description: string;
};
