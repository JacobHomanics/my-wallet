import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useThemeColors } from '@/hooks/useThemeColors';

/** UIKit default is 49; web needs a bit more so descenders (e.g. "g") are not clipped. */
const TAB_BAR_CONTENT_HEIGHT = Platform.OS === 'web' ? 54 : 49;

export function useBottomTabBarStyle() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const colors = useThemeColors();

  if (isDesktopWeb) {
    return {
      backgroundColor: colors.surface,
      borderTopColor: colors.rowBorder,
    } as const;
  }

  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.rowBorder,
    // Custom height replaces UIKit 49 and must include the bottom inset.
    height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
  } as const;
}
