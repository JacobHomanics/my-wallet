import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useThemeColors } from '@/hooks/useThemeColors';

import {
  PROFILE_STACK_INITIAL_ROUTE,
  profileStackScreens,
} from '@/navigation/ProfileStack.shared';
import type { ProfileStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  const isDesktopWeb = useIsDesktopWeb();
  const colors = useThemeColors();

  return (
    <WebStack.Navigator
      initialRouteName={PROFILE_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'slide_from_right',
        cardStyle: {
          flex: 1,
          backgroundColor: colors.bg,
          height: '100%',
        },
      }}
    >
      <WebStack.Screen name="index" component={profileStackScreens.index} />
      <WebStack.Screen
        name="settings"
        component={profileStackScreens.settings}
      />
      <WebStack.Screen
        name="profileSettings"
        component={profileStackScreens.profileSettings}
      />
      <WebStack.Screen
        name="appearanceSettings"
        component={profileStackScreens.appearanceSettings}
      />
      <WebStack.Screen
        name="moneySettings"
        component={profileStackScreens.moneySettings}
      />
      <WebStack.Screen
        name="onrampSettings"
        component={profileStackScreens.onrampSettings}
      />
      <WebStack.Screen
        name="sendSettings"
        component={profileStackScreens.sendSettings}
      />
      <WebStack.Screen
        name="earnSettings"
        component={profileStackScreens.earnSettings}
      />
    </WebStack.Navigator>
  );
}
