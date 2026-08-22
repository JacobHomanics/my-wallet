import {
  CommonActions,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/hooks/useAuth';
import { useAuthenticatedDestination } from '@/hooks/useAuthenticatedDestination';
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
]);

/** Authenticated routes that should not force onboarding or layout choice. */
const AUTH_GATE_BYPASS_ROUTES = new Set<string>([
  'splash',
  'exportWallet',
  'config',
  'welcome',
  'login',
  'loginVerify',
]);

const AUTH_GATE_ROUTES = new Set<string>(['onboarding', 'chooseAppLayout']);

export function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { isReady, isAuthenticated } = useAuth();
  const { destination, isReady: destinationReady } =
    useAuthenticatedDestination();
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

    if (!destinationReady || !destination) {
      return;
    }

    if (AUTH_GATE_BYPASS_ROUTES.has(activeRootRoute.name)) {
      return;
    }

    if (activeRootRoute.name === destination) {
      return;
    }

    if (destination !== 'main' || AUTH_GATE_ROUTES.has(activeRootRoute.name)) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: destination }],
        }),
      );
    }
  }, [destination, destinationReady, isAuthenticated, isReady, navigationRef]);

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
