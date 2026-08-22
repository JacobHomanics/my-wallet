import { StyleSheet, Text, View } from 'react-native';

import { HoloTapGentlyButton } from '@/components/HoloTapGentlyButton';
import { IconButton } from '@/components/IconButton';
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
  compact?: boolean;
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
  onExport,
  compact = false,
}: WalletDebitCardProps) {
  const theme = CARD_THEME[wallet.chain];

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={[styles.topBlock, compact && styles.topBlockCompact]}>
        <View style={styles.addressHeader}>
          <Text
            style={[styles.cardNumber, compact && styles.cardNumberCompact]}
            selectable
          >
            {formatWalletAddress(wallet.address, 6, 4)}
          </Text>
          <IconButton
            accessibilityLabel={
              copied ? 'Address copied' : `Copy ${wallet.label} address`
            }
            backgroundColor="rgba(255, 255, 255, 0.14)"
            color={copied ? '#86efac' : '#d1fae5'}
            icon={copied ? 'checkmark' : 'copy-outline'}
            iconSize={compact ? 14 : 15}
            onPress={onCopy}
            size={compact ? 26 : 28}
          />
        </View>
        {compact ? null : (
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: theme.chip }]} />
            {onExport ? (
              <HoloTapGentlyButton
                accessibilityLabel={`Export ${wallet.label} private key`}
                onPress={onExport}
              />
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.bottomRow}>
        <Text
          style={[styles.accountLabel, compact && styles.accountLabelCompact]}
          numberOfLines={1}
        >
          {accountLabel}
        </Text>
        <Text
          style={[
            styles.chainLabel,
            compact && styles.chainLabelCompact,
            { color: theme.accent },
          ]}
        >
          {wallet.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minHeight: 158,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
  },
  topBlock: {
    gap: 8,
  },
  topBlockCompact: {
    gap: 0,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#f0fdf4',
    letterSpacing: 1.1,
    fontVariant: ['tabular-nums'],
  },
  cardNumberCompact: {
    fontSize: 14,
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    width: 30,
    height: 22,
    borderRadius: 5,
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
    fontSize: 11,
    fontWeight: '500',
    color: '#d1fae5',
  },
  accountLabelCompact: {
    fontSize: 10,
  },
  chainLabel: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chainLabelCompact: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
