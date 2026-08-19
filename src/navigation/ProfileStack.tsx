import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  PROFILE_STACK_INITIAL_ROUTE,
  profileStackScreens,
} from '@/navigation/ProfileStack.shared';
import type { ProfileStackParamList } from '@/navigation/types';

const NativeStack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <NativeStack.Navigator
      initialRouteName={PROFILE_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <NativeStack.Screen name="index" component={profileStackScreens.index} />
      <NativeStack.Screen
        name="settings"
        component={profileStackScreens.settings}
      />
      <NativeStack.Screen
        name="profileSettings"
        component={profileStackScreens.profileSettings}
      />
      <NativeStack.Screen
        name="moneySettings"
        component={profileStackScreens.moneySettings}
      />
      <NativeStack.Screen
        name="onrampSettings"
        component={profileStackScreens.onrampSettings}
      />
      <NativeStack.Screen
        name="sendSettings"
        component={profileStackScreens.sendSettings}
      />
      <NativeStack.Screen
        name="earnSettings"
        component={profileStackScreens.earnSettings}
      />
    </NativeStack.Navigator>
  );
}
