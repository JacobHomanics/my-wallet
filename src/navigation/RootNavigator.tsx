import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { rootLinking } from '@/navigation/linking';
import { RootStack } from '@/navigation/RootStack';

export function RootNavigator() {
  return (
    <NavigationContainer linking={rootLinking}>
      <RootStack />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}
