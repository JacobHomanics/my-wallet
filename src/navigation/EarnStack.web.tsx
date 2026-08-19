import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useThemeColors } from '@/hooks/useThemeColors';

import {
  EARN_STACK_INITIAL_ROUTE,
  earnStackScreens,
} from '@/navigation/EarnStack.shared';
import type { EarnStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<EarnStackParamList>();

export function EarnStack() {
  const isDesktopWeb = useIsDesktopWeb();
  const colors = useThemeColors();

  return (
    <WebStack.Navigator
      initialRouteName={EARN_STACK_INITIAL_ROUTE}
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
      <WebStack.Screen name="index" component={earnStackScreens.index} />
    </WebStack.Navigator>
  );
}
