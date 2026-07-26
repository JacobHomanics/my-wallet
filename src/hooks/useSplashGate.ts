import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

export type AppScreen = 'splash' | 'home' | 'login';

const SPLASH_MIN_DURATION_MS = 1000;

SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden (e.g. web / late call).
});

export function useSplashGate(): { screen: AppScreen } {
  const { isReady, isAuthenticated } = useAuth();
  const [hasMinDurationElapsed, setHasMinDurationElapsed] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasMinDurationElapsed(true);
    }, SPLASH_MIN_DURATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const canLeaveSplash = isReady && hasMinDurationElapsed;

  useEffect(() => {
    if (!canLeaveSplash) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {
      // No-op if the splash screen is already hidden.
    });
  }, [canLeaveSplash]);

  if (!canLeaveSplash) {
    return { screen: 'splash' };
  }

  return { screen: isAuthenticated ? 'home' : 'login' };
}
