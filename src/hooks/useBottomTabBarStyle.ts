import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';

/** UIKit default is 49; web needs a bit more so descenders (e.g. "g") are not clipped. */
const TAB_BAR_CONTENT_HEIGHT = Platform.OS === 'web' ? 54 : 49;

export function useBottomTabBarStyle() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) {
    return {
      backgroundColor: '#ffffff',
      borderTopColor: '#d1fae5',
    } as const;
  }

  return {
    backgroundColor: '#ffffff',
    borderTopColor: '#d1fae5',
    // Custom height replaces UIKit 49 and must include the bottom inset.
    height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
  } as const;
}
