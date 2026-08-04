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
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';

type AccountNumberProps = {
  identityId: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Account number with copy and help actions.
 */
export function AccountNumber({
  identityId,
  style,
}: AccountNumberProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const { infoOpen, openInfo, closeInfo } = useAccountNumberInfoModal();

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.label}>Account Number</Text>
            <Text style={styles.value} selectable>
              {formatWalletAddress(identityId, 10, 8)}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="About account number"
            accessibilityRole="button"
            hitSlop={8}
            onPress={openInfo}
            style={({ pressed }) => [
              styles.helpButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="help-circle-outline"
              size={20}
              color="#5a7d6a"
            />
          </Pressable>
          <Pressable
            accessibilityLabel={
              isCopied('account-number')
                ? 'Account number copied'
                : 'Copy account number'
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              void copy(identityId, 'account-number');
            }}
            style={({ pressed }) => [
              styles.copyButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={
                isCopied('account-number') ? 'checkmark' : 'copy-outline'
              }
              size={18}
              color={isCopied('account-number') ? '#15803d' : '#166534'}
            />
          </Pressable>
        </View>

      </View>

      <AccountNumberInfoModal onClose={closeInfo} visible={infoOpen} />
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
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
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
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  copyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
