import { Ionicons } from '@expo/vector-icons';
import {
  BottomTabBar,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ZitiIcon } from '@/components/ZitiIcon';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { useAppBrand } from '@/hooks/useAppBrand';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

const TAB_ICONS = {
  contacts: { focused: 'people', outline: 'people-outline' },
  rewards: { focused: 'gift', outline: 'gift-outline' },
  earn: { focused: 'trending-up', outline: 'trending-up-outline' },
  profile: { focused: 'person', outline: 'person-outline' },
} as const;

type TabRouteName = keyof typeof TAB_ICONS;

function WebTopNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { name, tagline } = useAppBrand();
  const theme = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        <View style={styles.iconBadge}>
          <ZitiIcon
            size={22}
            color={theme.primaryText}
            detailColor={theme.primary}
          />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.brand}>{name}</Text>
          <Text style={styles.tagline}>{tagline}</Text>
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
          const tint = isFocused ? theme.primary : theme.textMuted;

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
              {route.name === 'home' ? (
                <ZitiIcon
                  size={18}
                  color={tint}
                  detailColor={isFocused ? theme.border : theme.surface}
                />
              ) : icons ? (
                <Ionicons
                  name={isFocused ? icons.focused : icons.outline}
                  size={18}
                  color={tint}
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
        onOpenProfile={() => {
          navigation.navigate('profile');
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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      minHeight: 64,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      boxShadow: `0 1px 3px ${c.primaryOverlay}`,
      zIndex: 10,
    },
    brandBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandText: {
      gap: 2,
    },
    brand: {
      fontSize: 18,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: -0.3,
    },
    tagline: {
      fontSize: 12,
      color: c.textMuted,
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
      backgroundColor: c.border,
    },
    linkHovered: {
      backgroundColor: c.surfaceMuted,
    },
    linkLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
    },
    linkLabelActive: {
      color: c.primary,
      fontWeight: '600',
    },
  });
}
