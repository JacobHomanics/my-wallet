import { Ionicons } from '@expo/vector-icons';
import {StyleSheet, 
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { TaxInfoModal } from '@/components/TaxInfoModal';
import { IconButton } from '@/components/IconButton';
import { useAppTax } from '@/hooks/useAppTax';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useShowTaxDetails } from '@/hooks/useShowTaxDetails';
import { useTaxInfoModal } from '@/hooks/useTaxInfoModal';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export type TaxDetailsCollapsibleProps = {
  /** Formatted service fee amount, e.g. "$0.05". */
  taxLabel: string;
  /** When set, selects sponsored vs unsponsored service fee rate for the label. */
  gasSponsorship?: boolean;
  /** When false, label reads "Service fee" without the rate percentage. */
  showRatePercent?: boolean;
  showEvm?: boolean;
  showSolana?: boolean;
  /** Optional style override for the outer section (e.g. margin). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Collapsible service fee row with destination wallet addresses.
 */
export function TaxDetailsCollapsible({
  taxLabel,
  gasSponsorship = true,
  showRatePercent = true,
  showEvm = false,
  showSolana = false,
  style,
}: TaxDetailsCollapsibleProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const { showTaxDetails, toggleTaxDetails } = useShowTaxDetails();
  const { taxInfoOpen, openTaxInfo, closeTaxInfo } = useTaxInfoModal();
  const { copy, isCopied } = useCopyToClipboard();
  const {
    ratePercentLabel,
    evmAddress: taxEvmAddress,
    solanaAddress: taxSolanaAddress,
  } = useAppTax(gasSponsorship);

  if (!showEvm && !showSolana) {
    return null;
  }

  return (
    <View style={[styles.taxSection, style]}>
      <View style={styles.taxHeader}>
        <View style={styles.taxHeaderLeft}>
          <Pressable
            accessibilityLabel={
              showTaxDetails
                ? 'Hide service fee destination details'
                : 'Show service fee destination details'
            }
            accessibilityRole="button"
            accessibilityState={{ expanded: showTaxDetails }}
            hitSlop={6}
            onPress={toggleTaxDetails}
            style={({ pressed }) => [
              styles.taxToggle,
              pressed && styles.taxHeaderPressed,
            ]}
          >
            <Text style={styles.taxLabel}>
              {showRatePercent
                ? `Service fee (${ratePercentLabel}%)`
                : 'Service fee'}
            </Text>
            <Ionicons
              name={showTaxDetails ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textMuted}
            />
          </Pressable>
          <IconButton
            accessibilityLabel="About service fee"
            color={colors.textMuted}
            icon="help-circle-outline"
            iconSize={18}
            onPress={openTaxInfo}
            size={28}
          />
        </View>
        <Pressable
          accessibilityLabel={
            showTaxDetails
              ? 'Hide service fee destination details'
              : 'Show service fee destination details'
          }
          accessibilityRole="button"
          onPress={toggleTaxDetails}
          style={({ pressed }) => pressed && styles.taxHeaderPressed}
        >
          <Text style={styles.taxValue}>{taxLabel}</Text>
        </Pressable>
      </View>

      {showTaxDetails ? (
        <View style={styles.taxDetails}>
          <Text style={styles.taxDetailsLabel}>Goes to</Text>
          {showEvm ? (
            <View style={styles.taxAddressRow}>
              <Text style={styles.toChainLabel}>EVM</Text>
              <Text style={styles.toAddress} selectable>
                {formatWalletAddress(taxEvmAddress)}
              </Text>
              <IconButton
                accessibilityLabel={
                  isCopied('tax-evm')
                    ? 'Service fee EVM address copied'
                    : 'Copy service fee EVM address'
                }
                color={isCopied('tax-evm') ? colors.success : colors.textMuted}
                icon={isCopied('tax-evm') ? 'checkmark' : 'copy-outline'}
                iconSize={18}
                onPress={() => {
                  void copy(taxEvmAddress, 'tax-evm');
                }}
                size={32}
              />
            </View>
          ) : null}
          {showSolana ? (
            <View style={styles.taxAddressRow}>
              <Text style={styles.toChainLabel}>Solana</Text>
              <Text style={styles.toAddress} selectable>
                {formatWalletAddress(taxSolanaAddress)}
              </Text>
              <IconButton
                accessibilityLabel={
                  isCopied('tax-solana')
                    ? 'Service fee Solana address copied'
                    : 'Copy service fee Solana address'
                }
                color={isCopied('tax-solana') ? colors.success : colors.textMuted}
                icon={isCopied('tax-solana') ? 'checkmark' : 'copy-outline'}
                iconSize={18}
                onPress={() => {
                  void copy(taxSolanaAddress, 'tax-solana');
                }}
                size={32}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <TaxInfoModal onClose={closeTaxInfo} visible={taxInfoOpen} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  taxSection: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  taxHeaderPressed: {
    opacity: 0.75,
  },
  taxHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taxToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
  },
  taxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
    fontVariant: ['tabular-nums'],
  },
  taxDetails: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.bg,
  },
  taxDetailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  taxAddressRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 10,
  },
  toChainLabel: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '600',
    color: c.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toAddress: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '500',
    color: c.primary,
    fontVariant: ['tabular-nums'],
  },
});
}
