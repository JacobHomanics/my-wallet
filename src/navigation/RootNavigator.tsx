import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { useWebNavigationA11yFix } from '@/hooks/useWebNavigationA11yFix';
import { rootLinking } from '@/navigation/linking';
import { RootStack } from '@/navigation/RootStack';
import type { RootStackParamList } from '@/navigation/types';

export function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  useWebNavigationA11yFix(navigationRef);

  return (
    <NavigationContainer ref={navigationRef} linking={rootLinking}>
      <RootStack />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}
