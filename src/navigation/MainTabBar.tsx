import { Ionicons } from '@expo/vector-icons';
import {
  BottomTabBar,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileDropdown } from '@/components/ProfileDropdown';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';

const TAB_ICONS = {
  home: { focused: 'wallet', outline: 'wallet-outline' },
  settings: { focused: 'settings', outline: 'settings-outline' },
} as const;

type TabRouteName = keyof typeof TAB_ICONS;

function WebTopNav({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        <Ionicons name="wallet" size={28} color="#0f172a" />
        <View style={styles.brandText}>
          <Text style={styles.brand}>My Wallet</Text>
          <Text style={styles.tagline}>Your wallet, ready when you are.</Text>
        </View>
      </View>

      <View style={styles.links}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name as TabRouteName];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              onPress={onPress}
              style={(pressState) => {
                const hovered =
                  'hovered' in pressState && Boolean(pressState.hovered);
                return [
                  styles.link,
                  isFocused && styles.linkActive,
                  (hovered || pressState.pressed) &&
                    !isFocused &&
                    styles.linkHovered,
                ];
              }}
            >
              {icons ? (
                <Ionicons
                  name={isFocused ? icons.focused : icons.outline}
                  size={18}
                  color={isFocused ? '#0f172a' : '#64748b'}
                />
              ) : null}
              <Text
                style={[styles.linkLabel, isFocused && styles.linkLabelActive]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ProfileDropdown
        navigation={navigation as never}
        onOpenSettings={() => {
          navigation.navigate('settings');
        }}
      />
    </View>
  );
}

export function MainTabBar(props: BottomTabBarProps) {
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) {
    return <WebTopNav {...props} />;
  }

  return <BottomTabBar {...props} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
    zIndex: 10,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  brandText: {
    gap: 2,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 12,
    color: '#64748b',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: 8,
    marginLeft: 16,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  linkActive: {
    backgroundColor: '#e2e8f0',
  },
  linkHovered: {
    backgroundColor: '#f1f5f9',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  linkLabelActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
});
