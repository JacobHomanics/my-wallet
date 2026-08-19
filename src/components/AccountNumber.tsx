import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AccountNumberInfoModal } from '@/components/AccountNumberInfoModal';
import { IconButton } from '@/components/IconButton';
import { useAccountNumberInfoModal } from '@/hooks/useAccountNumberInfoModal';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

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
            <IconButton
              accessibilityLabel="About account number"
              color={colors.textMuted}
              icon="help-circle-outline"
              iconSize={16}
              onPress={openInfo}
              size={compact ? 28 : 32}
            />
          ) : null}
          <IconButton
            accessibilityLabel={
              isCopied(copyKey)
                ? showUsername
                  ? 'Username copied'
                  : 'Account number copied'
                : showUsername
                  ? 'Copy username'
                  : 'Copy account number'
            }
            color={isCopied(copyKey) ? colors.success : colors.primary}
            icon={isCopied(copyKey) ? 'checkmark' : 'copy-outline'}
            iconSize={compact ? 15 : 18}
            onPress={() => {
              void copy(value, copyKey);
            }}
            size={compact ? 28 : 32}
          />
        </View>
      </View>

      {!showUsername ? (
        <AccountNumberInfoModal onClose={closeInfo} visible={infoOpen} />
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  labelCompact: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
    fontVariant: ['tabular-nums'],
  },
  valueCompact: {
    fontSize: 12,
    fontWeight: '500',
    color: c.textSecondary,
  },
});
}
