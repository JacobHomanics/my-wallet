import { Ionicons } from '@expo/vector-icons';
import {
  useCallback,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import {
  getAvatarColor,
  useProfileIdentity,
} from '@/hooks/useProfileIdentity';
import {
  signOutAndReset,
  type SignOutNavigation,
} from '@/hooks/useSignOut';

type ProfileDropdownProps = {
  navigation: SignOutNavigation;
  onOpenSettings?: () => void;
};

/**
 * Scaffold-ETH–style account pill + dropdown for desktop web.
 */
export function ProfileDropdown({
  navigation,
  onOpenSettings,
}: ProfileDropdownProps) {
  const { logout } = useAuth();
  const { displayName, avatarSeed } = useProfileIdentity();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<View | null>(null);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useOutsideClick(
    containerRef as unknown as RefObject<Element | null>,
    closeDropdown,
  );

  const avatarColor = getAvatarColor(avatarSeed);
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <View ref={containerRef} style={styles.container} collapsable={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => {
          setIsOpen((open) => !open);
        }}
        style={(pressState) => {
          const hovered =
            'hovered' in pressState && Boolean(pressState.hovered);
          return [
            styles.trigger,
            (hovered || pressState.pressed || isOpen) && styles.triggerActive,
          ];
        }}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {displayName}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#3f6b52"
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.menu}>
          {onOpenSettings ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onOpenSettings();
                closeDropdown();
              }}
              style={(pressState) => [
                styles.menuItem,
                pressState.pressed && styles.menuItemPressed,
              ]}
            >
              <Ionicons name="settings-outline" size={18} color="#166534" />
              <Text style={styles.menuItemLabel}>Settings</Text>
            </Pressable>
          ) : null}

          {onOpenSettings ? <View style={styles.separator} /> : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              closeDropdown();
              void signOutAndReset(logout, navigation);
            }}
            style={(pressState) => [
              styles.menuItem,
              pressState.pressed && styles.menuItemPressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
            <Text style={[styles.menuItemLabel, styles.menuItemDanger]}>
              Log out
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 20,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 260,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    boxShadow: '0 1px 2px rgba(22, 101, 52, 0.08)',
  },
  triggerActive: {
    backgroundColor: '#d1fae5',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  triggerLabel: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    minWidth: 220,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    boxShadow: '0 8px 24px rgba(22, 101, 52, 0.12)',
    zIndex: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemPressed: {
    backgroundColor: '#f0fdf4',
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  menuItemDanger: {
    color: '#b91c1c',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginVertical: 4,
    marginHorizontal: 10,
  },
});
