import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useThemeColors } from '@/hooks/useThemeColors';

import {
  HOME_STACK_INITIAL_ROUTE,
  homeStackScreens,
} from '@/navigation/HomeStack.shared';
import type { HomeStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const isDesktopWeb = useIsDesktopWeb();
  const colors = useThemeColors();

  return (
    <WebStack.Navigator
      initialRouteName={HOME_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'slide_from_right',
        cardStyle: {
          flex: 1,
          backgroundColor: colors.bg,
          // Absolute-fill cards so nested ScrollViews get a bounded height
          // (required for touch scrolling on iOS Safari).
          height: '100%',
        },
      }}
    >
      <WebStack.Screen name="index" component={homeStackScreens.index} />
      <WebStack.Screen
        name="tokenDetails"
        component={homeStackScreens.tokenDetails}
      />
      <WebStack.Screen
        name="transactions"
        component={homeStackScreens.transactions}
      />
      <WebStack.Screen name="receive" component={homeStackScreens.receive} />
      <WebStack.Screen name="request" component={homeStackScreens.request} />
      <WebStack.Screen
        name="stripeOnramp"
        component={homeStackScreens.stripeOnramp}
      />
      <WebStack.Screen
        name="stripeOnrampComponents"
        component={homeStackScreens.stripeOnrampComponents}
      />
      <WebStack.Screen
        name="receiveQr"
        component={homeStackScreens.receiveQr}
      />
      <WebStack.Screen name="send" component={homeStackScreens.send} />
      <WebStack.Screen
        name="sendSearch"
        component={homeStackScreens.sendSearch}
      />
      <WebStack.Screen
        name="sendAdvancedSearch"
        component={homeStackScreens.sendAdvancedSearch}
      />
      <WebStack.Screen
        name="sendAmount"
        component={homeStackScreens.sendAmount}
      />
      <WebStack.Screen
        name="confirmSend"
        component={homeStackScreens.confirmSend}
      />
      <WebStack.Screen name="sent" component={homeStackScreens.sent} />
    </WebStack.Navigator>
  );
}
