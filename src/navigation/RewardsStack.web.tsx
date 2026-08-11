import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import {
  REWARDS_STACK_INITIAL_ROUTE,
  rewardsStackScreens,
} from '@/navigation/RewardsStack.shared';
import type { RewardsStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<RewardsStackParamList>();

export function RewardsStack() {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <WebStack.Navigator
      initialRouteName={REWARDS_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'slide_from_right',
        cardStyle: {
          flex: 1,
          backgroundColor: '#FFF4E6',
          height: '100%',
        },
      }}
    >
      <WebStack.Screen name="index" component={rewardsStackScreens.index} />
    </WebStack.Navigator>
  );
}
