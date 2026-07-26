import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';

import {
  ROOT_STACK_INITIAL_ROUTE,
  rootStackScreens,
} from '@/navigation/RootStack.shared';
import type { RootStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <WebStack.Navigator
      initialRouteName={ROOT_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <WebStack.Screen name="splash" component={rootStackScreens.splash} />
      <WebStack.Screen name="welcome" component={rootStackScreens.welcome} />
      <WebStack.Screen name="login" component={rootStackScreens.login} />
      <WebStack.Screen
        name="loginVerify"
        component={rootStackScreens.loginVerify}
      />
      <WebStack.Screen name="home" component={rootStackScreens.home} />
    </WebStack.Navigator>
  );
}
