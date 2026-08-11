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
import { useConfirmSignOut } from '@/hooks/useConfirmSignOut';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';

type ProfileDropdownProps = {
  onOpenProfile?: () => void;
};

/**
 * Scaffold-ETH–style account pill + dropdown for desktop web.
 */
export function ProfileDropdown({
  onOpenProfile,
}: ProfileDropdownProps) {
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
              <Ionicons name="person-outline" size={18} color="#D33D3D" />
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
            <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
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
    backgroundColor: '#FFDCC8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5BFA9',
    boxShadow: '0 1px 2px rgba(211, 61, 61, 0.08)',
  },
  triggerActive: {
    backgroundColor: '#F5BFA9',
  },
  triggerLabel: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#D33D3D',
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
    borderColor: '#F5BFA9',
    boxShadow: '0 8px 24px rgba(211, 61, 61, 0.12)',
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
    backgroundColor: '#FFF4E6',
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D33D3D',
  },
  menuItemDanger: {
    color: '#b91c1c',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F5BFA9',
    marginVertical: 4,
    marginHorizontal: 10,
  },
});
