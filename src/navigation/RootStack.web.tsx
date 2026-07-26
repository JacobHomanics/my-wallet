import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import {
  ROOT_STACK_INITIAL_ROUTE,
  rootStackScreens,
} from '@/navigation/RootStack.shared';
import type { RootStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<RootStackParamList>();

export function RootStack() {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <WebStack.Navigator
      initialRouteName={ROOT_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'slide_from_right',
      }}
    >
      <WebStack.Screen name="splash" component={rootStackScreens.splash} />
      <WebStack.Screen name="welcome" component={rootStackScreens.welcome} />
      <WebStack.Screen name="login" component={rootStackScreens.login} />
      <WebStack.Screen
        name="loginVerify"
        component={rootStackScreens.loginVerify}
      />
      <WebStack.Screen name="main" component={rootStackScreens.main} />
    </WebStack.Navigator>
  );
}
