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
import {
  calculateEarnedYield,
  formatEarnApy,
  formatEarnAssetSymbol,
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
  const [amount, setAmount] = useState('');

  const onRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const assetSymbol = vault ? formatEarnAssetSymbol(vault.asset.symbol) : 'USDC';
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

  const handleDeposit = useCallback(async () => {
    const result = await deposit(amount.trim());
    if (result) {
      setAmount('');
    }
  }, [amount, deposit]);

  const handleWithdraw = useCallback(async () => {
    const trimmed = amount.trim();
    if (trimmed) {
      await withdraw(trimmed);
      return;
    }
    await withdrawAll();
  }, [amount, withdraw, withdrawAll]);

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
              {vault ? (
                <View style={styles.card}>
                  <Text style={styles.vaultName}>{vault.name}</Text>
                  <Text style={styles.apyLabel}>Current APY</Text>
                  <Text style={styles.apy}>{formatEarnApy(vault.user_apy)}</Text>
                  <Text style={styles.hint}>
                    Yield from {vault.provider} on {assetSymbol}
                  </Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.balanceLabel}>In vault</Text>
                <Text style={styles.balance} accessibilityRole="header">
                  {vaultBalance} {assetSymbol}
                </Text>
                <Text style={styles.yieldHint}>
                  Earned yield: {earnedYield} {assetSymbol}
                </Text>
                {walletAssetBalance != null ? (
                  <Text style={styles.hint}>
                    Wallet balance: {walletAssetBalance} {assetSymbol}
                  </Text>
                ) : null}
              </View>

              <View style={styles.card}>
                <Text style={styles.inputLabel}>Amount ({assetSymbol})</Text>
                <TextInput
                  accessibilityLabel={`Amount in ${assetSymbol}`}
                  editable={!acting && ready}
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#86a894"
                  style={styles.input}
                  value={amount}
                />
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={acting || !ready || !amount.trim()}
                    onPress={() => {
                      void handleDeposit();
                    }}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (acting || !ready || !amount.trim()) &&
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
                      {amount.trim() ? 'Withdraw' : 'Withdraw all'}
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  main: {
    width: '100%',
    gap: 16,
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
  vaultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  apyLabel: {
    fontSize: 13,
    color: '#5a7d6a',
    marginTop: 4,
  },
  apy: {
    fontSize: 32,
    fontWeight: '700',
    color: '#166534',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#5a7d6a',
  },
  balance: {
    fontSize: 28,
    fontWeight: '700',
    color: '#166534',
  },
  yieldHint: {
    fontSize: 14,
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#166534',
    backgroundColor: '#f0fdf4',
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
