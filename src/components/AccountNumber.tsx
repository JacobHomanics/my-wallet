import type { ReactNode } from 'react';
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
  email?: string | null;
  phone?: string | null;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type Field = {
  label: string;
  value: string;
  copyKey: string;
  copyNoun: string;
  compact: boolean;
  showHelp: boolean;
};

function resolveField({
  identityId,
  username,
  email,
  phone,
}: AccountNumberProps): Field | null {
  const trimmedUsername = username?.trim() || null;
  if (trimmedUsername) {
    return {
      label: 'Username',
      value: `@${trimmedUsername}`,
      copyKey: 'username',
      copyNoun: 'username',
      compact: false,
      showHelp: false,
    };
  }

  const trimmedEmail = email?.trim() || null;
  if (trimmedEmail) {
    return {
      label: 'Email',
      value: trimmedEmail,
      copyKey: 'email',
      copyNoun: 'email',
      compact: false,
      showHelp: false,
    };
  }

  const trimmedPhone = phone?.trim() || null;
  if (trimmedPhone) {
    return {
      label: 'Phone',
      value: trimmedPhone,
      copyKey: 'phone',
      copyNoun: 'phone number',
      compact: false,
      showHelp: false,
    };
  }

  const trimmedIdentityId = identityId?.trim() || null;
  if (trimmedIdentityId) {
    return {
      label: 'Account Number',
      value: trimmedIdentityId,
      copyKey: 'account-number',
      copyNoun: 'account number',
      compact: true,
      showHelp: true,
    };
  }

  return null;
}

/**
 * Account number, username, email, or phone with copy (and help for account numbers).
 */
export function AccountNumber({
  identityId,
  username,
  email,
  phone,
  footer,
  style,
}: AccountNumberProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const { copy, isCopied } = useCopyToClipboard();
  const { infoOpen, openInfo, closeInfo } = useAccountNumberInfoModal();
  const field = resolveField({ identityId, username, email, phone });

  if (!field) {
    return null;
  }

  const { label, value, copyKey, copyNoun, compact, showHelp } = field;

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
          {showHelp ? (
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
                ? `${copyNoun.charAt(0).toUpperCase()}${copyNoun.slice(1)} copied`
                : `Copy ${copyNoun}`
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

      {footer ? <View style={styles.footer}>{footer}</View> : null}

      {showHelp ? (
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
  footer: {
    marginTop: 8,
    alignItems: 'center',
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
