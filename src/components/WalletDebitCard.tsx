import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { UserWallet } from '@/hooks/useUserWallets.shared';

type WalletDebitCardProps = {
  wallet: UserWallet;
  /** Email or phone shown like a cardholder name. */
  accountLabel: string;
  copied: boolean;
  onCopy: () => void;
};

const CARD_THEME = {
  ethereum: {
    background: '#166534',
    accent: '#38bdf8',
    chip: '#365c45',
  },
  solana: {
    background: '#042f2e',
    accent: '#2dd4bf',
    chip: '#115e59',
  },
} as const;

/**
 * Debit-card presentation of a single chain address inside the user's Wallet.
 */
export function WalletDebitCard({
  wallet,
  accountLabel,
  copied,
  onCopy,
}: WalletDebitCardProps) {
  const theme = CARD_THEME[wallet.chain];

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={styles.topBlock}>
        <View style={styles.addressHeader}>
          <Text style={styles.cardNumber} selectable>
            {formatWalletAddress(wallet.address, 6, 4)}
          </Text>
          <Pressable
            accessibilityLabel={
              copied ? 'Address copied' : `Copy ${wallet.label} address`
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={onCopy}
            style={({ pressed }) => [
              styles.copyButton,
              pressed && styles.copyButtonPressed,
            ]}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copied ? '#86efac' : '#d1fae5'}
            />
          </Pressable>
        </View>
        <View style={[styles.chip, { backgroundColor: theme.chip }]} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.accountLabel} numberOfLines={1}>
          {accountLabel}
        </Text>
        <Text style={[styles.chainLabel, { color: theme.accent }]}>
          {wallet.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 188,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topBlock: {
    gap: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardNumber: {
    flex: 1,
    minWidth: 0,
    fontSize: 20,
    fontWeight: '600',
    color: '#f0fdf4',
    letterSpacing: 1.4,
    fontVariant: ['tabular-nums'],
  },
  copyButton: {
    padding: 4,
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '500',
    color: '#d1fae5',
  },
  chainLabel: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
