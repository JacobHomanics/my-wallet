import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Platform } from 'react-native';

import { CashboxIcon } from '@/components/CashboxIcon';
import { useBottomTabBarStyle } from '@/hooks/useBottomTabBarStyle';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { HomeStack } from '@/navigation/HomeStack';
import { MainTabBar } from '@/navigation/MainTabBar';
import { ProfileStack } from '@/navigation/ProfileStack';
import type { MainTabParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const isDesktopWeb = useIsDesktopWeb();
  const tabBarStyle = useBottomTabBarStyle();

  return (
    <Tab.Navigator
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'shift',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 200,
          },
        },
        tabBarPosition: isDesktopWeb ? 'top' : 'bottom',
        tabBarActiveTintColor: '#166534',
        tabBarInactiveTintColor: '#86a894',
        tabBarStyle,
        tabBarLabelStyle: {
          lineHeight: 13,
        },
        // Pass a bounded height into tab scenes so nested ScrollViews scroll on web.
        sceneStyle:
          Platform.OS === 'web' ? { flex: 1, minHeight: 0 } : undefined,
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeStack}
        options={({ route }) => {
          const focusedRoute =
            getFocusedRouteNameFromRoute(route) ?? 'index';
          // Keep the desktop top nav; on mobile hide the tab bar for the push.
          const hideTabBar =
            !isDesktopWeb &&
            (focusedRoute === 'tokenDetails' ||
              focusedRoute === 'contacts' ||
              focusedRoute === 'newContact' ||
              focusedRoute === 'receive' ||
              focusedRoute === 'request' ||
              focusedRoute === 'receiveQr' ||
              focusedRoute === 'send' ||
              focusedRoute === 'confirmSend' ||
              focusedRoute === 'sent');

          return {
            title: 'Home',
            tabBarStyle: hideTabBar ? { display: 'none' } : tabBarStyle,
            tabBarIcon: ({ color, size }) => (
              <CashboxIcon
                size={size}
                color={color}
                detailColor={colors.surface}
              />
            ),
          };
        }}
      />
      <Tab.Screen
        name="profile"
        component={ProfileStack}
        options={({ route }) => {
          const focusedRoute =
            getFocusedRouteNameFromRoute(route) ?? 'index';
          const hideTabBar = !isDesktopWeb && focusedRoute === 'settings';

          return {
            title: 'Profile',
            tabBarStyle: hideTabBar ? { display: 'none' } : tabBarStyle,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                color={color}
                size={size}
              />
            ),
          };
        }}
      />
    </Tab.Navigator>
  );
}
