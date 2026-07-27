import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  HOME_STACK_INITIAL_ROUTE,
  homeStackScreens,
} from '@/navigation/HomeStack.shared';
import type { HomeStackParamList } from '@/navigation/types';

const NativeStack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <NativeStack.Navigator
      initialRouteName={HOME_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <NativeStack.Screen name="index" component={homeStackScreens.index} />
      <NativeStack.Screen
        name="tokenDetails"
        component={homeStackScreens.tokenDetails}
      />
      <NativeStack.Screen name="send" component={homeStackScreens.send} />
      <NativeStack.Screen
        name="confirmSend"
        component={homeStackScreens.confirmSend}
      />
    </NativeStack.Navigator>
  );
}
