import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  REWARDS_STACK_INITIAL_ROUTE,
  rewardsStackScreens,
} from '@/navigation/RewardsStack.shared';
import type { RewardsStackParamList } from '@/navigation/types';

const NativeStack = createNativeStackNavigator<RewardsStackParamList>();

export function RewardsStack() {
  return (
    <NativeStack.Navigator
      initialRouteName={REWARDS_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <NativeStack.Screen name="index" component={rewardsStackScreens.index} />
    </NativeStack.Navigator>
  );
}
