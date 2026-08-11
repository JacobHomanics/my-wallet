import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AccountNumberInfoModal } from '@/components/AccountNumberInfoModal';
import { useAccountNumberInfoModal } from '@/hooks/useAccountNumberInfoModal';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

type AccountNumberProps = {
  identityId?: string | null;
  username?: string | null;
  style?: StyleProp<ViewStyle>;
};

/**
 * Account number or username with copy (and help for account numbers).
 */
export function AccountNumber({
  identityId,
  username,
  style,
}: AccountNumberProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const { infoOpen, openInfo, closeInfo } = useAccountNumberInfoModal();

  const trimmedUsername = username?.trim() || null;
  const showUsername = Boolean(trimmedUsername);
  const value = showUsername
    ? `@${trimmedUsername}`
    : (identityId?.trim() || '');
  const copyKey = showUsername ? 'username' : 'account-number';
  const label = showUsername ? 'Username' : 'Account Number';
  const compact = !showUsername;

  if (!value) {
    return null;
  }

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.header}>
          <View style={[styles.headerText, compact && styles.headerTextCompact]}>
            <Text style={[styles.label, compact && styles.labelCompact]}>
              {label}
            </Text>
            <Text
              style={[styles.value, compact && styles.valueCompact]}
              selectable
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {value}
            </Text>
          </View>
          {!showUsername ? (
            <Pressable
              accessibilityLabel="About account number"
              accessibilityRole="button"
              hitSlop={8}
              onPress={openInfo}
              style={({ pressed }) => [
                styles.helpButton,
                styles.actionCompact,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color="#9B5A5A"
              />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={
              isCopied(copyKey)
                ? showUsername
                  ? 'Username copied'
                  : 'Account number copied'
                : showUsername
                  ? 'Copy username'
                  : 'Copy account number'
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              void copy(value, copyKey);
            }}
            style={({ pressed }) => [
              styles.copyButton,
              compact && styles.actionCompact,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={isCopied(copyKey) ? 'checkmark' : 'copy-outline'}
              size={compact ? 15 : 18}
              color={isCopied(copyKey) ? '#15803d' : '#D33D3D'}
            />
          </Pressable>
        </View>
      </View>

      {!showUsername ? (
        <AccountNumberInfoModal onClose={closeInfo} visible={infoOpen} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5BFA9',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  cardCompact: {
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 4,
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  headerTextCompact: {
    gap: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B5A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  labelCompact: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  helpButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D33D3D',
    fontVariant: ['tabular-nums'],
  },
  valueCompact: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3f6b52',
  },
  copyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCompact: {
    width: 28,
    height: 28,
  },
});
