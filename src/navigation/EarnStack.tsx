import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  EARN_STACK_INITIAL_ROUTE,
  earnStackScreens,
} from '@/navigation/EarnStack.shared';
import type { EarnStackParamList } from '@/navigation/types';

const NativeStack = createNativeStackNavigator<EarnStackParamList>();

export function EarnStack() {
  return (
    <NativeStack.Navigator
      initialRouteName={EARN_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <NativeStack.Screen name="index" component={earnStackScreens.index} />
    </NativeStack.Navigator>
  );
}
