import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SampleStamp } from '@/components/SampleStamp';
import { SignUpLoginBanner } from '@/components/SignUpLoginBanner';
import { SignUpLoginPromptModal } from '@/components/SignUpLoginPromptModal';
import { useAuthGatedAction } from '@/hooks/useAuthGatedAction';
import { usePrivyEarn } from '@/hooks/usePrivyEarn';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  calculateEarnedYield,
  formatEarnApy,
  formatEarnRawAmount,
} from '@/lib/privy/earn';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

export function EarnScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const {
    ready,
    configured,
    loading,
    refreshing,
    acting,
    error,
    actionError,
    isPreview,
    vault,
    position,
    walletAssetBalance,
    vaultBalanceUsd,
    refresh,
    deposit,
    withdraw,
    withdrawAll,
  } = usePrivyEarn();
  const {
    currencySymbol,
    formatFromUsd,
    formatSignedFromUsd,
    formatAmountInput,
    parseDisplayInputToUsd,
    defaultFormattedZero,
  } = useFiatDisplay();
  const [amount, setAmount] = useState('');

  const onRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const vaultBalanceFiat =
    formatFromUsd(vaultBalanceUsd) ?? defaultFormattedZero;
  const earnedYield =
    position != null
      ? formatEarnRawAmount(
          calculateEarnedYield(position).toString(),
          position.asset.decimals,
        )
      : '0';
  const earnedYieldUsd = Number(earnedYield);
  const earnedYieldFiat =
    Number.isFinite(earnedYieldUsd)
      ? formatSignedFromUsd(earnedYieldUsd) ?? defaultFormattedZero
      : defaultFormattedZero;
  const walletBalanceUsd = Number(walletAssetBalance ?? '0');
  const walletBalanceFiat =
    Number.isFinite(walletBalanceUsd) && walletBalanceUsd >= 0
      ? formatFromUsd(walletBalanceUsd) ?? defaultFormattedZero
      : defaultFormattedZero;
  const usdAmount = parseDisplayInputToUsd(amount.trim());
  const hasValidAmount = usdAmount != null && usdAmount > 0;

  const getTokenAmountFromInput = useCallback((): string | null => {
    if (!hasValidAmount || usdAmount == null) {
      return null;
    }
    return formatAmountInput(usdAmount);
  }, [formatAmountInput, hasValidAmount, usdAmount]);

  const handleDeposit = useCallback(async () => {
    const tokenAmount = getTokenAmountFromInput();
    if (!tokenAmount) {
      return;
    }
    const result = await deposit(tokenAmount);
    if (result) {
      setAmount('');
    }
  }, [deposit, getTokenAmountFromInput]);

  const handleWithdraw = useCallback(async () => {
    const tokenAmount = getTokenAmountFromInput();
    if (tokenAmount) {
      await withdraw(tokenAmount);
      return;
    }
    await withdrawAll();
  }, [getTokenAmountFromInput, withdraw, withdrawAll]);

  const {
    run: onPressDeposit,
    openAuthPrompt,
    authPromptOpen,
    closeAuthPrompt,
    confirmAuthPrompt,
  } = useAuthGatedAction(() => {
    void handleDeposit();
  });
  const onPressWithdraw = useCallback(() => {
    if (isPreview) {
      openAuthPrompt();
      return;
    }
    void handleWithdraw();
  }, [handleWithdraw, isPreview, openAuthPrompt]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topBarTitle}>Earn</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#166534"
            />
          }
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : !configured ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Set up Privy Earn</Text>
              <Text style={styles.bodyText}>
                Deploy a fee wrapper and configure your vault in the Privy
                Dashboard under Wallet infrastructure → Earn.
              </Text>
              <Text style={styles.bodyText}>
                Copy the vault ID and set it on Convex:
              </Text>
              <Text style={styles.code} selectable>
                npx convex env set PRIVY_EARN_VAULT_ID {'<vault_id>'}
              </Text>
              <Text style={styles.hint}>
                See the{' '}
                <Text style={styles.link}>Privy Earn setup guide</Text> for
                vault selection and verification.
              </Text>
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.main}>
              <Text style={styles.heroLabel}>In vault</Text>
              <View style={styles.heroBalanceWrap}>
                <Text style={styles.heroBalance} accessibilityRole="header">
                  {vaultBalanceFiat}
                </Text>
                {isPreview ? (
                  <View style={styles.stampFaded} pointerEvents="none">
                    <SampleStamp />
                  </View>
                ) : null}
              </View>
              {vault ? (
                <View style={styles.heroMeta}>
                  <Text style={styles.heroHint}>
                    {formatEarnApy(vault.user_apy)} APY
                  </Text>
                  <Text style={styles.statLine}>Earned: {earnedYieldFiat}</Text>
                </View>
              ) : (
                <Text style={styles.statLine}>Earned: {earnedYieldFiat}</Text>
              )}

              <View style={styles.card}>
                {walletAssetBalance != null ? (
                  <View
                    accessibilityLabel={`Depositable balance: ${walletBalanceFiat}`}
                    style={[
                      styles.fieldRow,
                      styles.fieldRowDisabled,
                      styles.balanceRow,
                    ]}
                  >
                    <Text style={styles.balanceLabel}>Depositable balance:</Text>
                    <Text style={styles.balanceValue}>{walletBalanceFiat}</Text>
                  </View>
                ) : null}
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountPrefix}>{currencySymbol}</Text>
                  <TextInput
                    accessibilityLabel="Amount in display currency"
                    editable={!acting && ready}
                    keyboardType="decimal-pad"
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor="#86a894"
                    style={styles.amountInput}
                    value={amount}
                  />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={acting || !ready || !hasValidAmount}
                    onPress={onPressDeposit}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (acting || !ready || !hasValidAmount) &&
                        styles.buttonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    {acting ? (
                      <ActivityIndicator color={colors.primaryText} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Deposit</Text>
                    )}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={acting || !ready}
                    onPress={onPressWithdraw}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      (acting || !ready) && styles.buttonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {hasValidAmount ? 'Withdraw' : 'Withdraw all'}
                    </Text>
                  </Pressable>
                </View>
                {actionError ? (
                  <Text style={styles.error}>{actionError}</Text>
                ) : null}
              </View>

              <Text style={styles.disclaimer}>
                Yield is generated by third-party vaults and is not guaranteed.
                Using vaults involves risk, including loss of funds.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <SignUpLoginBanner />
      <SignUpLoginPromptModal
        visible={authPromptOpen}
        onCancel={closeAuthPrompt}
        onConfirm={confirmAuthPrompt}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: c.primary,
  },
  topBarSpacer: {
    width: 44,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  main: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroBalanceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBalance: {
    fontSize: 56,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  stampFaded: {
    ...StyleSheet.absoluteFill,
    opacity: 0.75,
  },
  heroHint: {
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 22,
    color: c.textMuted,
    textAlign: 'center',
  },
  heroMeta: {
    alignItems: 'center',
    gap: 4,
    marginTop: -8,
  },
  statLine: {
    fontSize: 14,
    color: c.textMuted,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.primary,
  },
  hint: {
    fontSize: 13,
    color: c.textMuted,
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 14,
    color: c.primary,
    lineHeight: 20,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: c.primary,
    backgroundColor: c.surfaceHighlight,
    padding: 12,
    borderRadius: 8,
  },
  link: {
    color: c.primary,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: c.surface,
    minHeight: 52,
  },
  fieldRowDisabled: {
    backgroundColor: c.surfaceMuted,
  },
  balanceRow: {
    paddingRight: 16,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textMuted,
    marginRight: 8,
  },
  balanceValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: c.bg,
    minHeight: 48,
  },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: c.primary,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: c.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: c.primary,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: c.surfaceHighlight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
  },
  primaryButtonText: {
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: c.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  error: {
    fontSize: 14,
    color: c.danger,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    color: c.textSubtle,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
}
