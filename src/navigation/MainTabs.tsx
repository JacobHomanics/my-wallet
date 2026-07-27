import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { useBottomTabBarStyle } from '@/hooks/useBottomTabBarStyle';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { HomeStack } from '@/navigation/HomeStack';
import { MainTabBar } from '@/navigation/MainTabBar';
import type { MainTabParamList } from '@/navigation/types';
import { SettingsScreen } from '@/screens/SettingsScreen';

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
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle,
        tabBarLabelStyle: {
          // Room for descenders; default fontSize 10 clips "g" in Settings on web.
          lineHeight: 13,
        },
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
              focusedRoute === 'send' ||
              focusedRoute === 'confirmSend' ||
              focusedRoute === 'sent');

          return {
            title: 'Home',
            tabBarStyle: hideTabBar ? { display: 'none' } : tabBarStyle,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                color={color}
                size={size}
              />
            ),
          };
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
