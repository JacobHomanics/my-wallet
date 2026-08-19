import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useAddressPortfolioBalances } from '@/hooks/useAddressPortfolioBalances';
import { useConfigScreen } from '@/hooks/useConfigScreen';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePollTokenBalances } from '@/hooks/usePollTokenBalances';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatTaxRatePercent } from '@/lib/tax';
import type { RootStackParamList } from '@/navigation/types';
import type { ThemeColors } from '@/theme/types';

type ConfigOptionRowProps = {
  label: string;
  value: string;
  monospace?: boolean;
};

function ConfigOptionRow({ label, value, monospace }: ConfigOptionRowProps) {
  const styles = useThemedStyles(createOptionStyles);

  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Text
        selectable
        style={[styles.optionValue, monospace && styles.optionValueMono]}
      >
        {value}
      </Text>
    </View>
  );
}

type ConfigOptionsSectionProps = {
  title: string;
  children: ReactNode;
};

function ConfigOptionsSection({ title, children }: ConfigOptionsSectionProps) {
  const styles = useThemedStyles(createSectionStyles);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionList}>{children}</View>
    </View>
  );
}

type ConfigWalletSectionProps = {
  title: string;
  subtitle?: string;
  address: string | null | undefined;
  chain: 'ethereum' | 'solana';
};

function ConfigWalletSection({
  title,
  subtitle,
  address,
  chain,
}: ConfigWalletSectionProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createSectionStyles);
  const { result, loading, errorMessage, refresh } = useAddressPortfolioBalances(
    address,
    chain,
  );

  usePollTokenBalances(refresh, { enabled: Boolean(address) });

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {loading ? (
          <ActivityIndicator color={colors.textMuted} size="small" />
        ) : null}
      </View>

      {address ? (
        <Text selectable style={styles.address}>
          {address}
        </Text>
      ) : (
        <Text style={styles.missing}>Address not configured</Text>
      )}

      {errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : result?.totalUsdLabel ? (
        <Text style={styles.totalUsd}>{result.totalUsdLabel} total</Text>
      ) : null}

      {result?.lines.length ? (
        <View style={styles.balanceList}>
          {result.lines.map((line) => (
            <View
              key={`${line.network}-${line.symbol}`}
              style={styles.balanceRow}
            >
              <View style={styles.balancePrimary}>
                <Text style={styles.balanceSymbol}>{line.symbol}</Text>
                <Text style={styles.balanceNetwork}>{line.networkLabel}</Text>
              </View>
              <View style={styles.balanceSecondary}>
                <Text style={styles.balanceAmount}>{line.balanceLabel}</Text>
                {line.usdLabel ? (
                  <Text style={styles.balanceUsd}>{line.usdLabel}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : address && !loading && !errorMessage ? (
        <Text style={styles.empty}>No token balances</Text>
      ) : null}

      <Pressable
        accessibilityLabel={`Refresh ${title} balances`}
        accessibilityRole="button"
        disabled={!address || loading}
        onPress={refresh}
        style={({ pressed }) => [
          styles.refreshButton,
          (!address || loading) && styles.refreshButtonDisabled,
          pressed && address && !loading && styles.refreshButtonPressed,
        ]}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </Pressable>
    </View>
  );
}

function formatBool(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Hidden screen at `/config` — backend config, treasury, tax, and cashback wallets.
 */
export function ConfigScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, loading } = useConfigScreen();

  const goHome = () => {
    navigation.navigate('main');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to home"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goHome}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton accessibilityLabel="Back to home" onPress={goHome} />
          )}
          <Text style={styles.topBarTitle}>Config</Text>
          <View style={styles.topBarSpacer} />
        </View>

        {loading || !data ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.textMuted} />
            <Text style={styles.loadingText}>Loading config…</Text>
          </View>
        ) : (
          <View style={styles.sections}>
            <ConfigOptionsSection title="Brand">
              <ConfigOptionRow
                label="Reward points label"
                value={data.config.brand.rewardPointsLabel}
              />
            </ConfigOptionsSection>

            <ConfigOptionsSection title="Gas">
              <ConfigOptionRow
                label="Gas sponsorship"
                value={formatBool(data.config.gasSponsorship)}
              />
            </ConfigOptionsSection>

            <ConfigOptionsSection title="Tax">
              <ConfigOptionRow
                label="Sponsored rate"
                value={`${formatTaxRatePercent(data.config.tax.sponsoredRate)}%`}
              />
              <ConfigOptionRow
                label="Unsponsored rate"
                value={`${formatTaxRatePercent(data.config.tax.unsponsoredRate)}%`}
              />
            </ConfigOptionsSection>

            <ConfigOptionsSection title="Rewards">
              <ConfigOptionRow
                label="Reference USD"
                value={`$${data.config.rewards.referenceUsd}`}
              />
              <ConfigOptionRow
                label="Reference points"
                value={String(data.config.rewards.referencePoints)}
              />
              <ConfigOptionRow
                label="Exponent"
                value={String(data.config.rewards.exponent)}
              />
              <ConfigOptionRow
                label="Min USD"
                value={`$${data.config.rewards.minUsd}`}
              />
            </ConfigOptionsSection>

            <ConfigOptionsSection title="Cashback">
              <ConfigOptionRow
                label="Points per USDC"
                value={String(data.config.cashback.pointsPerUsdc)}
              />
            </ConfigOptionsSection>

            <ConfigOptionsSection title="Tokens">
              <ConfigOptionRow
                label="Reward token"
                monospace
                value={data.tokens.rewardTokenAddress}
              />
              <ConfigOptionRow
                label="Reward chain ID"
                value={String(data.tokens.rewardChainId)}
              />
              <ConfigOptionRow
                label="Cashback USDC"
                monospace
                value={data.tokens.cashbackUsdcAddress}
              />
              <ConfigOptionRow
                label="Cashback chain ID"
                value={String(data.tokens.cashbackChainId)}
              />
            </ConfigOptionsSection>

            <ConfigWalletSection
              address={data.wallets.treasury}
              chain="ethereum"
              subtitle="CashBox Points reward sends"
              title="Treasury"
            />
            <ConfigWalletSection
              address={data.wallets.cashback}
              chain="ethereum"
              subtitle="USDC cashback redemptions"
              title="Cashback"
            />
            <ConfigWalletSection
              address={data.config.tax.evmAddress}
              chain="ethereum"
              subtitle="Service fee collection"
              title="Tax (EVM)"
            />
            <ConfigWalletSection
              address={data.config.tax.solanaAddress}
              chain="solana"
              subtitle="Service fee collection"
              title="Tax (Solana)"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: 20,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    topBarTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    topBarSpacer: {
      width: 40,
    },
    webBack: {
      paddingVertical: 8,
      paddingRight: 12,
    },
    webBackPressed: {
      opacity: 0.7,
    },
    webBackText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    loadingBlock: {
      alignItems: 'center',
      gap: 12,
      paddingVertical: 48,
    },
    loadingText: {
      fontSize: 15,
      color: colors.textMuted,
    },
    sections: {
      gap: 16,
    },
  });
}

function createOptionStyles(colors: ThemeColors) {
  return StyleSheet.create({
    optionRow: {
      gap: 4,
    },
    optionLabel: {
      fontSize: 13,
      color: colors.textMuted,
    },
    optionValue: {
      fontSize: 15,
      color: colors.text,
    },
    optionValueMono: {
      fontFamily: 'monospace',
      fontSize: 13,
      lineHeight: 18,
    },
  });
}

function createSectionStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    sectionHeaderText: {
      flex: 1,
      gap: 2,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    optionList: {
      gap: 12,
    },
    address: {
      fontFamily: 'monospace',
      fontSize: 13,
      lineHeight: 18,
      color: colors.text,
    },
    missing: {
      fontSize: 14,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    totalUsd: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    balanceList: {
      gap: 10,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    balancePrimary: {
      flex: 1,
      gap: 2,
    },
    balanceSymbol: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    balanceNetwork: {
      fontSize: 12,
      color: colors.textMuted,
    },
    balanceSecondary: {
      alignItems: 'flex-end',
      gap: 2,
    },
    balanceAmount: {
      fontSize: 14,
      color: colors.text,
    },
    balanceUsd: {
      fontSize: 12,
      color: colors.textMuted,
    },
    empty: {
      fontSize: 14,
      color: colors.textMuted,
    },
    error: {
      fontSize: 14,
      color: colors.danger,
    },
    refreshButton: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    refreshButtonDisabled: {
      opacity: 0.5,
    },
    refreshButtonPressed: {
      opacity: 0.7,
    },
    refreshButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
  });
}
