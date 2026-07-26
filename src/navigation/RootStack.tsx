import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  ROOT_STACK_INITIAL_ROUTE,
  rootStackScreens,
} from '@/navigation/RootStack.shared';
import type { RootStackParamList } from '@/navigation/types';

const NativeStack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <NativeStack.Navigator
      initialRouteName={ROOT_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <NativeStack.Screen name="splash" component={rootStackScreens.splash} />
      <NativeStack.Screen name="welcome" component={rootStackScreens.welcome} />
      <NativeStack.Screen name="login" component={rootStackScreens.login} />
      <NativeStack.Screen
        name="loginVerify"
        component={rootStackScreens.loginVerify}
      />
      <NativeStack.Screen name="home" component={rootStackScreens.home} />
    </NativeStack.Navigator>
  );
}
