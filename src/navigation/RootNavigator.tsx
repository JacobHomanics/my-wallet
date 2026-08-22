import {
  CommonActions,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/hooks/useAuth';
import { useNeedsOnboarding } from '@/hooks/useNeedsOnboarding';
import { useWebNavigationA11yFix } from '@/hooks/useWebNavigationA11yFix';
import { rootLinking } from '@/navigation/linking';
import { RootStack } from '@/navigation/RootStack';
import type { RootStackParamList } from '@/navigation/types';

const UNAUTHENTICATED_ROUTES = new Set<string>([
  'splash',
  'welcome',
  'login',
  'loginVerify',
  'exportWallet',
  'main',
]);

/** Authenticated routes that should not force the onboarding screen. */
const ONBOARDING_BYPASS_ROUTES = new Set<string>([
  'splash',
  'onboarding',
  'exportWallet',
  'config',
  'welcome',
  'login',
  'loginVerify',
]);

export function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { isReady, isAuthenticated } = useAuth();
  const { status: onboardingStatus } = useNeedsOnboarding();
  useWebNavigationA11yFix(navigationRef);

  const enforceAuthRoutes = useCallback(() => {
    if (!navigationRef.isReady() || !isReady) {
      return;
    }

    const rootState = navigationRef.getRootState();
    const activeRootRoute =
      rootState.routes[rootState.index ?? rootState.routes.length - 1];

    if (!activeRootRoute) {
      return;
    }

    if (!isAuthenticated) {
      if (UNAUTHENTICATED_ROUTES.has(activeRootRoute.name)) {
        return;
      }

      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'welcome' }],
        }),
      );
      return;
    }

    if (onboardingStatus === 'needed') {
      if (ONBOARDING_BYPASS_ROUTES.has(activeRootRoute.name)) {
        return;
      }

      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'onboarding' }],
        }),
      );
      return;
    }

    if (
      onboardingStatus === 'done' &&
      activeRootRoute.name === 'onboarding'
    ) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'main' }],
        }),
      );
    }
  }, [isAuthenticated, isReady, navigationRef, onboardingStatus]);

  useEffect(() => {
    enforceAuthRoutes();
  }, [enforceAuthRoutes]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={rootLinking}
      onReady={enforceAuthRoutes}
      onStateChange={enforceAuthRoutes}
    >
      <RootStack />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}
