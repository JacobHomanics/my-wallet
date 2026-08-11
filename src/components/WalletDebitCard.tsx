import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HoloTapGentlyButton } from '@/components/HoloTapGentlyButton';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { UserWallet } from '@/hooks/useUserWallets.shared';

type WalletDebitCardProps = {
  wallet: UserWallet;
  /** Email or phone shown like a cardholder name. */
  accountLabel: string;
  copied: boolean;
  onCopy: () => void;
  /** When set, shows a holographic “tap gently” export control on the card. */
  onExport?: () => void;
};

const CARD_THEME = {
  ethereum: {
    background: '#D33D3D',
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
  onExport,
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
              color={copied ? '#F19C7E' : '#F5BFA9'}
            />
          </Pressable>
        </View>
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: theme.chip }]} />
          {onExport ? (
            <HoloTapGentlyButton
              accessibilityLabel={`Export ${wallet.label} private key`}
              onPress={onExport}
            />
          ) : null}
        </View>
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
    color: '#FFF4E6',
    letterSpacing: 1.4,
    fontVariant: ['tabular-nums'],
  },
  copyButton: {
    padding: 4,
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    color: '#F5BFA9',
  },
  chainLabel: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
