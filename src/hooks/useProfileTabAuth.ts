import { useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useOpenLogin } from '@/hooks/useOpenLogin';

/**
 * Signed-out profile tab: label + press opens login instead of Profile.
 */
export function useProfileTabAuth() {
  const { isAuthenticated } = useAuth();
  const isDesktopWeb = useIsDesktopWeb();
  const openLogin = useOpenLogin();

  const onProfileTabPress = useCallback(
    (event: { preventDefault: () => void }) => {
      if (isAuthenticated) {
        return;
      }

      event.preventDefault();
      openLogin();
    },
    [isAuthenticated, openLogin],
  );

  return {
    isAuthenticated,
    profileTabLabel:
      isAuthenticated || isDesktopWeb ? 'Profile' : 'Sign up/Login',
    onProfileTabPress,
  };
}
