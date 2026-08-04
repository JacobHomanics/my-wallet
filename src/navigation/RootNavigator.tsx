import {
  CommonActions,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/hooks/useAuth';
import { useWebNavigationA11yFix } from '@/hooks/useWebNavigationA11yFix';
import { rootLinking } from '@/navigation/linking';
import { RootStack } from '@/navigation/RootStack';
import type { RootStackParamList } from '@/navigation/types';

const UNAUTHENTICATED_ROUTES = new Set<keyof RootStackParamList>([
  'splash',
  'welcome',
  'login',
  'loginVerify',
  'exportWallet',
]);

export function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { isReady, isAuthenticated } = useAuth();
  useWebNavigationA11yFix(navigationRef);

  const enforceUnauthenticatedRoute = useCallback(() => {
    if (!navigationRef.isReady() || !isReady || isAuthenticated) {
      return;
    }

    const currentRoute = navigationRef.getCurrentRoute();
    if (!currentRoute || UNAUTHENTICATED_ROUTES.has(currentRoute.name)) {
      return;
    }

    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'welcome' }],
      }),
    );
  }, [isAuthenticated, isReady, navigationRef]);

  useEffect(() => {
    enforceUnauthenticatedRoute();
  }, [enforceUnauthenticatedRoute]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={rootLinking}
      onReady={enforceUnauthenticatedRoute}
      onStateChange={enforceUnauthenticatedRoute}
    >
      <RootStack />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}
