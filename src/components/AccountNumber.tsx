import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';

type AccountNumberProps = {
  identityId: string;
};

/**
 * Displays the reversible wallet identity as an “Account Number”, with copy.
 */
export function AccountNumber({ identityId }: AccountNumberProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const copyKey = 'account-number';
  const copied = isCopied(copyKey);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Account Number</Text>
      <Pressable
        accessibilityLabel={copied ? 'Account number copied' : 'Copy account number'}
        accessibilityRole="button"
        onPress={() => {
          void copy(identityId, copyKey);
        }}
        style={({ pressed }) => [
          styles.row,
          pressed && styles.rowPressed,
        ]}
      >
        <Text style={styles.value} selectable>
          {formatWalletAddress(identityId, 10, 8)}
        </Text>
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={18}
          color={copied ? '#15803d' : '#166534'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 320,
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.85,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
});
