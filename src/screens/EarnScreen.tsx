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

import { usePrivyEarn } from '@/hooks/usePrivyEarn';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  calculateEarnedYield,
  formatEarnApy,
  formatEarnRawAmount,
} from '@/lib/privy/earn';

export function EarnScreen() {
  const insets = useSafeAreaInsets();
  const {
    ready,
    configured,
    loading,
    refreshing,
    acting,
    error,
    actionError,
    vault,
    position,
    walletAssetBalance,
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

  const vaultBalance =
    position != null
      ? formatEarnRawAmount(position.assets_in_vault, position.asset.decimals)
      : '0';
  const earnedYield =
    position != null
      ? formatEarnRawAmount(
          calculateEarnedYield(position).toString(),
          position.asset.decimals,
        )
      : '0';
  const vaultBalanceUsd = Number(vaultBalance);
  const vaultBalanceFiat =
    Number.isFinite(vaultBalanceUsd) && vaultBalanceUsd >= 0
      ? formatFromUsd(vaultBalanceUsd) ?? defaultFormattedZero
      : defaultFormattedZero;
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
            <ActivityIndicator color="#166534" />
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
              <Text style={styles.heroBalance} accessibilityRole="header">
                {vaultBalanceFiat}
              </Text>
              {vault ? (
                <Text style={styles.heroHint}>
                  {formatEarnApy(vault.user_apy)} APY
                </Text>
              ) : null}

              <View style={styles.statsBlock}>
                <Text style={styles.statLine}>Earned: {earnedYieldFiat}</Text>
                {walletAssetBalance != null ? (
                  <Text style={styles.statLine}>
                    Depositable balance: {walletBalanceFiat}
                  </Text>
                ) : null}
              </View>

              <View style={styles.card}>
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
                    onPress={() => {
                      void handleDeposit();
                    }}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (acting || !ready || !hasValidAmount) &&
                        styles.buttonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    {acting ? (
                      <ActivityIndicator color="#f0fdf4" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Deposit</Text>
                    )}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={acting || !ready}
                    onPress={() => {
                      void handleWithdraw();
                    }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    color: '#166534',
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
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroBalance: {
    fontSize: 56,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  heroHint: {
    marginTop: -8,
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 22,
    color: '#5a7d6a',
    textAlign: 'center',
  },
  statsBlock: {
    width: '100%',
    maxWidth: 320,
    gap: 6,
    alignItems: 'center',
  },
  statLine: {
    fontSize: 14,
    color: '#5a7d6a',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
  hint: {
    fontSize: 13,
    color: '#5a7d6a',
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#166534',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
  },
  link: {
    color: '#166534',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f0fdf4',
    minHeight: 48,
  },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#166534',
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
    backgroundColor: '#166534',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
  },
  primaryButtonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#166534',
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
    color: '#b91c1c',
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    color: '#86a894',
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
