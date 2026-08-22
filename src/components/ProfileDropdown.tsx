import { Ionicons } from '@expo/vector-icons';
import {
  useCallback,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ConfirmLogoutModal } from '@/components/ConfirmLogoutModal';
import { useAuth } from '@/hooks/useAuth';
import { useConfirmSignOut } from '@/hooks/useConfirmSignOut';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type ProfileDropdownProps = {
  onOpenProfile?: () => void;
};

/**
 * Scaffold-ETH–style account pill + dropdown for desktop web.
 */
export function ProfileDropdown({
  onOpenProfile,
}: ProfileDropdownProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const { isAuthenticated } = useAuth();
  const openLogin = useOpenLogin();
  const { displayName, avatarSeed } = useProfileIdentity();
  const { profilePhotoUrl } = useProfilePhoto();
  const {
    confirmVisible: logoutConfirmVisible,
    isSigningOut,
    requestSignOut,
    cancelSignOut,
    confirmSignOut,
  } = useConfirmSignOut();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<View | null>(null);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useOutsideClick(
    containerRef as unknown as RefObject<Element | null>,
    closeDropdown,
  );

  if (!isAuthenticated) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={openLogin}
        style={(pressState) => {
          const hovered =
            'hovered' in pressState && Boolean(pressState.hovered);
          return [
            styles.trigger,
            (hovered || pressState.pressed) && styles.triggerActive,
          ];
        }}
      >
        <Text style={styles.triggerLabel}>Sign in</Text>
      </Pressable>
    );
  }

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
        <Avatar
          label={displayName}
          photoUrl={profilePhotoUrl}
          seed={avatarSeed}
          size={28}
        />
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
          {onOpenProfile ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onOpenProfile();
                closeDropdown();
              }}
              style={(pressState) => [
                styles.menuItem,
                pressState.pressed && styles.menuItemPressed,
              ]}
            >
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={styles.menuItemLabel}>Profile</Text>
            </Pressable>
          ) : null}

          {onOpenProfile ? <View style={styles.separator} /> : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              closeDropdown();
              requestSignOut();
            }}
            style={(pressState) => [
              styles.menuItem,
              pressState.pressed && styles.menuItemPressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.menuItemLabel, styles.menuItemDanger]}>
              Log out
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ConfirmLogoutModal
        isSigningOut={isSigningOut}
        onCancel={cancelSignOut}
        onConfirm={() => {
          void confirmSignOut();
        }}
        visible={logoutConfirmVisible}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
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
    backgroundColor: c.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    boxShadow: '0 1px 2px rgba(22, 101, 52, 0.08)',
  },
  triggerActive: {
    backgroundColor: '#d1fae5',
  },
  triggerLabel: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    minWidth: 220,
    paddingVertical: 6,
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
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
    backgroundColor: c.bg,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: c.primary,
  },
  menuItemDanger: {
    color: c.danger,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginVertical: 4,
    marginHorizontal: 10,
  },
});
}
