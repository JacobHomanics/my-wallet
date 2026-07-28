import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { TokenIcon } from '@/components/TokenIcon';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { useAllocationInputUnit } from '@/hooks/useAllocationInputUnit';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendForm } from '@/hooks/useSendForm';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useStrategyPicker } from '@/hooks/useStrategyPicker';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { formatUsdValue } from '@/lib/alchemy/fetchTokensByAddress';
import type { HomeStackParamList } from '@/navigation/types';

export function SendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'send'>>();
  const { tokens, totalUsd, loading, ready, ethereumAddress, solanaAddress } =
    useTokenBalances();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const { allocationInputUnit, setAllocationInputUnit } =
    useAllocationInputUnit();
  const {
    strategies,
    selectedStrategy,
    selectedStrategyId,
    pickerOpen: strategyPickerOpen,
    openPicker: openStrategyPicker,
    closePicker: closeStrategyPicker,
    onSelectStrategy,
  } = useStrategyPicker();
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);

  const form = useSendForm(
    tokens,
    selectedStrategyId,
    route.params?.tokenId,
    allocationInputUnit,
  );
  const {
    amount,
    allocations,
    allocationInputs,
    needsEthereumRecipient,
    needsSolanaRecipient,
    ethereumRecipient,
    solanaRecipient,
    ethereumRecipientValid,
    solanaRecipientValid,
    insufficientFunds,
    canContinue,
    setEthereumRecipient,
    setSolanaRecipient,
    setAmount,
    setAllocationAmount,
    removeAllocation,
    addAllocation,
  } = form;

  const totalLabel = formatUsdValue(totalUsd) ?? '$0.00';
  const hasWallet = Boolean(ethereumAddress || solanaAddress);

  const amountError =
    amount.trim() && insufficientFunds
      ? 'Insufficient funds for this amount'
      : amount.trim() && !form.amountValid
        ? 'Enter a valid amount'
        : null;

  const ethereumRecipientError =
    needsEthereumRecipient &&
    ethereumRecipient.trim() &&
    !ethereumRecipientValid
      ? 'Enter a valid Ethereum address'
      : null;

  const solanaRecipientError =
    needsSolanaRecipient && solanaRecipient.trim() && !solanaRecipientValid
      ? 'Enter a valid Solana address'
      : null;

  const onContinue = useCallback(() => {
    if (!canContinue || allocations.length === 0) {
      return;
    }

    navigation.navigate('confirmSend', {
      usdAmount: amount,
      ethereumRecipient: needsEthereumRecipient
        ? ethereumRecipient.trim()
        : undefined,
      solanaRecipient: needsSolanaRecipient
        ? solanaRecipient.trim()
        : undefined,
      legs: allocations.map((leg) => ({
        tokenId: leg.token.id,
        amount: leg.amountFormatted,
      })),
    });
  }, [
    allocations,
    amount,
    canContinue,
    ethereumRecipient,
    navigation,
    needsEthereumRecipient,
    needsSolanaRecipient,
    solanaRecipient,
  ]);

  const goHome = useCallback(() => {
    navigation.navigate('index');
  }, [navigation]);

  const onAddToken = useCallback(
    (tokenId: string) => {
      addAllocation(tokenId);
      setTokenPickerOpen(false);
    },
    [addAllocation],
  );

  const allocatedTokenIds = allocations.map((leg) => leg.token.id);
  const canAddToken = tokens.some(
    (token) =>
      token.rawBalance > 0n && !allocatedTokenIds.includes(token.id),
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.shell}>
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
              <BackButton
                accessibilityLabel="Back to home"
                onPress={goHome}
              />
            )}
            <Text style={styles.topBarTitle}>Send</Text>
            <View style={styles.topBarSpacer} />
          </View>

          {!ready || (loading && tokens.length === 0) ? (
            <ActivityIndicator color="#0f172a" style={styles.loader} />
          ) : !hasWallet ? (
            <Text style={styles.empty}>Creating your wallets…</Text>
          ) : (
            <ScrollView
              contentContainerStyle={[
                styles.form,
                { paddingBottom: Math.max(insets.bottom, 16) + 40 },
              ]}
              keyboardShouldPersistTaps="handled"
              style={styles.flex}
            >
              <Text
                accessibilityLabel={`Balance ${totalLabel}`}
                style={styles.totalBalance}
              >
                {totalLabel}
              </Text>

              <Text style={styles.label}>Amount</Text>
              <View
                style={[
                  styles.fieldRow,
                  amountError ? styles.fieldRowError : null,
                ]}
              >
                <Text style={styles.amountPrefix}>$</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  style={styles.fieldInput}
                  value={amount}
                />
              </View>
              {amountError ? (
                <Text style={styles.fieldError}>{amountError}</Text>
              ) : null}

              {!needsEthereumRecipient && !needsSolanaRecipient ? (
                <>
                  <Text style={styles.label}>To</Text>
                  <View style={[styles.fieldRow, styles.fieldRowDisabled]}>
                    <Text style={styles.fieldPlaceholder}>
                      Enter an amount first
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {needsEthereumRecipient ? (
                    <>
                      <Text style={styles.label}>
                        {needsSolanaRecipient ? 'Ethereum recipient' : 'To'}
                      </Text>
                      <View
                        style={[
                          styles.fieldRow,
                          ethereumRecipientError
                            ? styles.fieldRowError
                            : null,
                        ]}
                      >
                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={setEthereumRecipient}
                          placeholder="0x… Ethereum address"
                          placeholderTextColor="#94a3b8"
                          style={styles.fieldInput}
                          value={ethereumRecipient}
                        />
                        {ethereumRecipient.trim() ? (
                          <Pressable
                            accessibilityLabel="Clear Ethereum recipient"
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() => {
                              setEthereumRecipient('');
                            }}
                            style={styles.clearButton}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#94a3b8"
                            />
                          </Pressable>
                        ) : null}
                      </View>
                      {ethereumRecipientError ? (
                        <Text style={styles.fieldError}>
                          {ethereumRecipientError}
                        </Text>
                      ) : null}
                    </>
                  ) : null}

                  {needsSolanaRecipient ? (
                    <>
                      <Text style={styles.label}>
                        {needsEthereumRecipient ? 'Solana recipient' : 'To'}
                      </Text>
                      <View
                        style={[
                          styles.fieldRow,
                          solanaRecipientError ? styles.fieldRowError : null,
                        ]}
                      >
                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={setSolanaRecipient}
                          placeholder="Solana address"
                          placeholderTextColor="#94a3b8"
                          style={styles.fieldInput}
                          value={solanaRecipient}
                        />
                        {solanaRecipient.trim() ? (
                          <Pressable
                            accessibilityLabel="Clear Solana recipient"
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() => {
                              setSolanaRecipient('');
                            }}
                            style={styles.clearButton}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#94a3b8"
                            />
                          </Pressable>
                        ) : null}
                      </View>
                      {solanaRecipientError ? (
                        <Text style={styles.fieldError}>
                          {solanaRecipientError}
                        </Text>
                      ) : null}
                    </>
                  ) : null}
                </>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showAdvanced }}
                onPress={toggleAdvanced}
                style={({ pressed }) => [
                  styles.advancedToggle,
                  pressed && styles.advancedTogglePressed,
                ]}
              >
                <Text style={styles.advancedToggleText}>
                  {showAdvanced
                    ? 'Hide advanced details'
                    : 'Show advanced details'}
                </Text>
                <Ionicons
                  name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748b"
                />
              </Pressable>

              {showAdvanced ? (
                <View style={styles.advanced}>
                  <Pressable
                    accessibilityLabel={`Payment strategy ${selectedStrategy.label}`}
                    accessibilityRole="button"
                    onPress={openStrategyPicker}
                    style={({ pressed }) => [
                      styles.strategyRow,
                      pressed && styles.strategyRowPressed,
                    ]}
                  >
                    <Text style={styles.strategyRowLabel}>Strategy</Text>
                    <Text style={styles.strategyRowValue} numberOfLines={1}>
                      {selectedStrategy.label}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                  </Pressable>

                  <View style={styles.advancedDivider} />

                  <View style={styles.tokensHeader}>
                    <Text style={[styles.advancedLabel, styles.tokensHeaderLabel]}>
                      Tokens
                    </Text>
                    <View style={styles.unitToggle}>
                      <Pressable
                        accessibilityLabel="Edit amounts in tokens"
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: allocationInputUnit === 'token',
                        }}
                        onPress={() => {
                          setAllocationInputUnit('token');
                        }}
                        style={({ pressed }) => [
                          styles.unitToggleOption,
                          allocationInputUnit === 'token' &&
                            styles.unitToggleOptionActive,
                          pressed && styles.unitToggleOptionPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitToggleText,
                            allocationInputUnit === 'token' &&
                              styles.unitToggleTextActive,
                          ]}
                        >
                          Token
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel="Edit amounts in USD"
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: allocationInputUnit === 'usd',
                        }}
                        onPress={() => {
                          setAllocationInputUnit('usd');
                        }}
                        style={({ pressed }) => [
                          styles.unitToggleOption,
                          allocationInputUnit === 'usd' &&
                            styles.unitToggleOptionActive,
                          pressed && styles.unitToggleOptionPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitToggleText,
                            allocationInputUnit === 'usd' &&
                              styles.unitToggleTextActive,
                          ]}
                        >
                          USD
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  {allocations.length === 0 ? (
                    <Text style={styles.allocationEmpty}>
                      Enter an amount or add a token to get started.
                    </Text>
                  ) : (
                    allocations.map((leg) => {
                      const inputValue =
                        allocationInputs[leg.token.id] ??
                        (allocationInputUnit === 'usd'
                          ? String(leg.usd)
                          : leg.amountFormatted);
                      const exceeds =
                        leg.amountRaw > leg.token.rawBalance;
                      const secondaryValue =
                        allocationInputUnit === 'usd'
                          ? leg.amountFormatted || '—'
                          : (formatUsdValue(leg.usd) ?? '—');
                      return (
                        <View
                          key={leg.token.id}
                          style={styles.allocationRow}
                        >
                          <View style={styles.allocationHeader}>
                            <TokenIcon
                              logoUrl={leg.token.logoUrl}
                              network={leg.token.network}
                              size={32}
                              symbol={leg.token.symbol}
                            />
                            <View style={styles.allocationText}>
                              <View style={styles.allocationTitleRow}>
                                <Text
                                  style={styles.allocationSymbol}
                                  numberOfLines={1}
                                >
                                  {leg.token.symbol}
                                </Text>
                                <Text
                                  style={styles.allocationBalance}
                                  numberOfLines={1}
                                >
                                  Balance:{' '}
                                  {allocationInputUnit === 'usd'
                                    ? (formatUsdValue(leg.token.usdValue) ??
                                      '—')
                                    : leg.token.balanceFormatted}
                                </Text>
                              </View>
                              <Text
                                style={styles.allocationMeta}
                                numberOfLines={1}
                              >
                                {leg.token.networkLabel}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.allocationControls}>
                            {allocationInputUnit === 'usd' ? (
                              <Text style={styles.allocationInputPrefix}>
                                $
                              </Text>
                            ) : null}
                            <TextInput
                              accessibilityLabel={
                                allocationInputUnit === 'usd'
                                  ? `${leg.token.symbol} USD amount`
                                  : `${leg.token.symbol} amount`
                              }
                              keyboardType="decimal-pad"
                              onChangeText={(value) => {
                                setAllocationAmount(leg.token.id, value);
                              }}
                              placeholder="0"
                              placeholderTextColor="#94a3b8"
                              style={[
                                styles.allocationInput,
                                exceeds ? styles.allocationInputError : null,
                              ]}
                              value={inputValue}
                            />
                            <Text
                              style={styles.allocationSecondary}
                              numberOfLines={1}
                            >
                              {secondaryValue}
                            </Text>
                            <Pressable
                              accessibilityLabel={`Remove ${leg.token.symbol}`}
                              accessibilityRole="button"
                              hitSlop={8}
                              onPress={() => {
                                removeAllocation(leg.token.id);
                              }}
                              style={({ pressed }) => [
                                styles.allocationRemove,
                                pressed && styles.allocationRemovePressed,
                              ]}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color="#b91c1c"
                              />
                            </Pressable>
                          </View>
                        </View>
                      );
                    })
                  )}

                  {canAddToken ? (
                    <Pressable
                      accessibilityLabel="Add token"
                      accessibilityRole="button"
                      onPress={() => {
                        setTokenPickerOpen(true);
                      }}
                      style={({ pressed }) => [
                        styles.addTokenButton,
                        pressed && styles.addTokenButtonPressed,
                      ]}
                    >
                      <Ionicons name="add" size={18} color="#0f172a" />
                      <Text style={styles.addTokenButtonText}>Add token</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={!canContinue}
                onPress={onContinue}
                style={({ pressed }) => [
                  styles.continueButton,
                  !canContinue && styles.continueButtonDisabled,
                  pressed && canContinue && styles.continueButtonPressed,
                ]}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>

      <StrategyPickerModal
        onClose={closeStrategyPicker}
        onSelect={onSelectStrategy}
        selectedStrategyId={selectedStrategyId}
        strategies={strategies}
        visible={strategyPickerOpen}
      />

      <TokenPickerModal
        excludeTokenIds={allocatedTokenIds}
        onClose={() => {
          setTokenPickerOpen(false);
        }}
        onSelect={onAddToken}
        tokens={tokens}
        visible={tokenPickerOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  shell: {
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
    color: '#0f172a',
  },
  topBarSpacer: {
    width: 44,
  },
  webBack: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
  },
  totalBalance: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 40,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: '#fff',
    minHeight: 52,
  },
  fieldRowDisabled: {
    backgroundColor: '#f1f5f9',
  },
  fieldRowError: {
    borderColor: '#fca5a5',
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  fieldPlaceholder: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#94a3b8',
  },
  amountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 4,
  },
  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: '#b91c1c',
  },
  advancedToggle: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 4,
  },
  advanced: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  advancedLabel: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tokensHeader: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tokensHeaderLabel: {
    marginTop: 0,
    marginBottom: 0,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  unitToggleOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unitToggleOptionActive: {
    backgroundColor: '#fff',
  },
  unitToggleOptionPressed: {
    opacity: 0.7,
  },
  unitToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  unitToggleTextActive: {
    color: '#0f172a',
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  strategyRowPressed: {
    opacity: 0.7,
  },
  strategyRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 12,
  },
  strategyRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  allocationEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    paddingVertical: 10,
  },
  allocationRow: {
    paddingVertical: 10,
    gap: 8,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allocationText: {
    flex: 1,
    minWidth: 0,
  },
  allocationTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    minWidth: 0,
  },
  allocationSymbol: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  allocationMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#94a3b8',
  },
  allocationBalance: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  allocationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allocationInputPrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  allocationInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
    backgroundColor: '#f8fafc',
    fontVariant: ['tabular-nums'],
  },
  allocationInputError: {
    borderColor: '#fca5a5',
  },
  allocationSecondary: {
    minWidth: 64,
    maxWidth: 96,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    fontVariant: ['tabular-nums'],
  },
  allocationRemove: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationRemovePressed: {
    opacity: 0.6,
  },
  addTokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  addTokenButtonPressed: {
    opacity: 0.7,
  },
  addTokenButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  continueButton: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonPressed: {
    opacity: 0.85,
  },
  continueButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
});
