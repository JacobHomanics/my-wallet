import { useColorTheme } from '@/hooks/useColorTheme';
import type { ThemeColors } from '@/theme/types';

export function useThemeColors(): ThemeColors {
  return useColorTheme().colors;
}
