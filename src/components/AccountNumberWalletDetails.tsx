import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AccountNumber } from '@/components/AccountNumber';
import { ConfirmExportPrivateKeyModal } from '@/components/ConfirmExportPrivateKeyModal';
import { ExportPrivateKeyWebView } from '@/components/ExportPrivateKeyWebView';
import { WalletDebitCard } from '@/components/WalletDebitCard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useWalletAdvancedDetails } from '@/hooks/useWalletAdvancedDetails';
import type { ThemeColors } from '@/theme/types';

type AccountNumberWalletDetailsProps = {
  identityId?: string | null;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

/**
 * Account number with a Show advanced details footer and wallet cards.
 */
export function AccountNumberWalletDetails({
  identityId,
  style,
  compact = false,
}: AccountNumberWalletDetailsProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const {
    showAdvanced,
    toggleAdvanced,
    showAdvancedToggle,
    showWallets,
    ready,
    wallets,
    displayName,
    copy,
    isCopied,
    pendingWallet,
    confirmVisible,
    requestExport,
    cancelConfirm,
    confirmExport,
    exportWebViewUri,
    closeExportWebView,
  } = useWalletAdvancedDetails();

  const footer = showAdvancedToggle ? (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ expanded: showAdvanced }}
      hitSlop={8}
      onPress={toggleAdvanced}
      style={({ pressed }) => [
        styles.detailsLink,
        pressed && styles.detailsLinkPressed,
      ]}
    >
      <Text style={styles.detailsLinkText}>
        {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
      </Text>
      <Ionicons
        name={showAdvanced ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={colors.textMuted}
      />
    </Pressable>
  ) : null;

  if (!identityId && !footer && !showWallets) {
    return null;
  }

  return (
    <>
      <View style={styles.block}>
        {identityId ? (
          <AccountNumber
            identityId={identityId}
            footer={footer}
            style={style}
          />
        ) : (
          footer
        )}

        {showWallets ? (
          <View style={[styles.wallets, compact && styles.walletsCompact]}>
            {!ready ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : wallets.length === 0 ? (
              <Text style={styles.empty}>Creating your wallet…</Text>
            ) : (
              wallets.map((wallet) => {
                const walletKey = `${wallet.chain}-${wallet.address}`;

                return (
                  <WalletDebitCard
                    key={walletKey}
                    compact={compact}
                    wallet={wallet}
                    accountLabel={displayName}
                    copied={isCopied(walletKey)}
                    onCopy={() => {
                      void copy(wallet.address, walletKey);
                    }}
                    onExport={
                      compact
                        ? undefined
                        : () => {
                          requestExport(wallet);
                        }
                    }
                  />
                );
              })
            )}
          </View>
        ) : null}
      </View>

      {compact ? null : (
        <>
          <ConfirmExportPrivateKeyModal
            visible={confirmVisible}
            walletLabel={pendingWallet?.label ?? ''}
            onCancel={cancelConfirm}
            onConfirm={confirmExport}
          />

          <ExportPrivateKeyWebView
            onClose={closeExportWebView}
            uri={exportWebViewUri}
          />
        </>
      )}
    </>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    detailsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    detailsLinkPressed: {
      opacity: 0.6,
    },
    detailsLinkText: {
      fontSize: 15,
      fontWeight: '500',
      color: c.textMuted,
      textDecorationLine: 'underline',
    },
    block: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
    },
    wallets: {
      width: '100%',
      marginTop: 8,
      gap: 12,
    },
    walletsCompact: {
      gap: 8,
    },
    loader: {
      marginTop: 8,
    },
    empty: {
      fontSize: 15,
      color: c.textSubtle,
    },
  });
}
