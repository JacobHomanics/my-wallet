import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { TaxInfoModal } from '@/components/TaxInfoModal';
import { useAppTax } from '@/hooks/useAppTax';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useShowTaxDetails } from '@/hooks/useShowTaxDetails';
import { useTaxInfoModal } from '@/hooks/useTaxInfoModal';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';

export type TaxDetailsCollapsibleProps = {
  /** Formatted service fee amount, e.g. "$0.05". */
  taxLabel: string;
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
  showEvm = false,
  showSolana = false,
  style,
}: TaxDetailsCollapsibleProps) {
  const { showTaxDetails, toggleTaxDetails } = useShowTaxDetails();
  const { taxInfoOpen, openTaxInfo, closeTaxInfo } = useTaxInfoModal();
  const { copy, isCopied } = useCopyToClipboard();
  const {
    ratePercentLabel,
    evmAddress: taxEvmAddress,
    solanaAddress: taxSolanaAddress,
  } = useAppTax();

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
              Service fee ({ratePercentLabel}%)
            </Text>
            <Ionicons
              name={showTaxDetails ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#5a7d6a"
            />
          </Pressable>
          <Pressable
            accessibilityLabel="About service fee"
            accessibilityRole="button"
            hitSlop={8}
            onPress={openTaxInfo}
            style={({ pressed }) => [
              styles.helpButton,
              pressed && styles.helpButtonPressed,
            ]}
          >
            <Ionicons name="help-circle-outline" size={18} color="#5a7d6a" />
          </Pressable>
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
              <Pressable
                accessibilityLabel={
                  isCopied('tax-evm')
                    ? 'Service fee EVM address copied'
                    : 'Copy service fee EVM address'
                }
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  void copy(taxEvmAddress, 'tax-evm');
                }}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
              >
                <Ionicons
                  name={isCopied('tax-evm') ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={isCopied('tax-evm') ? '#15803d' : '#5a7d6a'}
                />
              </Pressable>
            </View>
          ) : null}
          {showSolana ? (
            <View style={styles.taxAddressRow}>
              <Text style={styles.toChainLabel}>Solana</Text>
              <Text style={styles.toAddress} selectable>
                {formatWalletAddress(taxSolanaAddress)}
              </Text>
              <Pressable
                accessibilityLabel={
                  isCopied('tax-solana')
                    ? 'Service fee Solana address copied'
                    : 'Copy service fee Solana address'
                }
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  void copy(taxSolanaAddress, 'tax-solana');
                }}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
              >
                <Ionicons
                  name={isCopied('tax-solana') ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={isCopied('tax-solana') ? '#15803d' : '#5a7d6a'}
                />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <TaxInfoModal onClose={closeTaxInfo} visible={taxInfoOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#5a7d6a',
  },
  helpButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonPressed: {
    opacity: 0.7,
  },
  taxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  taxDetails: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b7e4c7',
    backgroundColor: '#f0fdf4',
  },
  taxDetailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#86a894',
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
    color: '#86a894',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toAddress: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '500',
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  copyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonPressed: {
    opacity: 0.65,
  },
});
