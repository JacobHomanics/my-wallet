import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import {
  HOME_STACK_INITIAL_ROUTE,
  homeStackScreens,
} from '@/navigation/HomeStack.shared';
import type { HomeStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <WebStack.Navigator
      initialRouteName={HOME_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'slide_from_right',
      }}
    >
      <WebStack.Screen name="home" component={homeStackScreens.home} />
      <WebStack.Screen
        name="tokenDetails"
        component={homeStackScreens.tokenDetails}
      />
    </WebStack.Navigator>
  );
}
