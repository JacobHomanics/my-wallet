import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Platform, Text } from 'react-native';

import { ZitiIcon } from '@/components/ZitiIcon';
import { useBottomTabBarStyle } from '@/hooks/useBottomTabBarStyle';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useProfileTabAuth } from '@/hooks/useProfileTabAuth';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ContactsStack } from '@/navigation/ContactsStack';
import { EarnStack } from '@/navigation/EarnStack';
import { HomeStack } from '@/navigation/HomeStack';
import { MainTabBar } from '@/navigation/MainTabBar';
import { ProfileStack } from '@/navigation/ProfileStack';
import { RewardsStack } from '@/navigation/RewardsStack';
import type { MainTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const isDesktopWeb = useIsDesktopWeb();
  const tabBarStyle = useBottomTabBarStyle();
  const colors = useThemeColors();
  const { isAuthenticated, profileTabLabel, onProfileTabPress } =
    useProfileTabAuth();

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
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
              focusedRoute === 'receive' ||
              focusedRoute === 'request' ||
              focusedRoute === 'stripeOnramp' ||
              focusedRoute === 'stripeOnrampComponents' ||
              focusedRoute === 'receiveQr' ||
              focusedRoute === 'send' ||
              focusedRoute === 'sendAmount' ||
              focusedRoute === 'confirmSend' ||
              focusedRoute === 'sent' ||
              focusedRoute === 'transactions');

          return {
            title: 'Home',
            tabBarStyle: hideTabBar ? { display: 'none' } : tabBarStyle,
            tabBarIcon: ({ color, size }) => (
              <ZitiIcon
                size={size}
                color={color}
                detailColor={colors.surface}
              />
            ),
          };
        }}
      />
      <Tab.Screen
        name="contacts"
        component={ContactsStack}
        options={({ route }) => {
          const focusedRoute =
            getFocusedRouteNameFromRoute(route) ?? 'index';
          const hideTabBar =
            !isDesktopWeb &&
            (focusedRoute === 'newContact' ||
              focusedRoute === 'newFarcasterContact' ||
              focusedRoute === 'newRawAddressContact' ||
              focusedRoute === 'contactDetails');

          return {
            title: 'Contacts',
            tabBarStyle: hideTabBar ? { display: 'none' } : tabBarStyle,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                color={color}
                size={size}
              />
            ),
          };
        }}
      />
      <Tab.Screen
        name="rewards"
        component={RewardsStack}
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'gift' : 'gift-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="earn"
        component={EarnStack}
        options={{
          title: 'Earn',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'trending-up' : 'trending-up-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="profile"
        component={ProfileStack}
        listeners={{
          tabPress: onProfileTabPress,
        }}
        options={({ route }) => {
          const focusedRoute =
            getFocusedRouteNameFromRoute(route) ?? 'index';
          const hideTabBar =
            !isDesktopWeb &&
            (focusedRoute === 'settings' ||
              focusedRoute === 'profileSettings' ||
              focusedRoute === 'moneySettings' ||
              focusedRoute === 'onrampSettings' ||
              focusedRoute === 'sendSettings' ||
              focusedRoute === 'earnSettings');

          return {
            title: profileTabLabel,
            tabBarStyle: hideTabBar ? { display: 'none' } : tabBarStyle,
            tabBarLabel: ({ color }) => (
              <Text
                numberOfLines={1}
                style={{
                  color,
                  fontSize: isAuthenticated ? 10 : 9,
                  lineHeight: 13,
                  textAlign: 'center',
                  fontWeight: isAuthenticated ? '400' : '600',
                }}
              >
                {profileTabLabel}
              </Text>
            ),
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={
                  isAuthenticated
                    ? focused
                      ? 'person'
                      : 'person-outline'
                    : 'log-in-outline'
                }
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
