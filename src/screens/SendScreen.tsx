import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SendAdvancedDetails } from '@/components/SendAdvancedDetails';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { updateSendDraft, useSendDraftUi } from '@/hooks/useSendDraft';
import { useSendForm } from '@/hooks/useSendForm';
import { useSendStrategyPicker } from '@/hooks/useStrategyPicker';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useSpendableTokens } from '@/hooks/useSpendableTokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { getNetworkChain } from '@/lib/alchemy/networks';
import {
  encodeWalletIdentity,
  tryDecodeWalletIdentity,
} from '@/lib/walletIdentity';
import { isValidRecipientAddress } from '@/lib/validation';
import type { HomeStackParamList } from '@/navigation/types';

export function SendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'send'>>();
  const { tokens, loading, ready, ethereumAddress, solanaAddress } =
    useTokenBalances();
  const { spendableTokens, availableUsd, availableLabel } =
    useSpendableTokens(tokens);
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const { allocationInputUnit, setAllocationInputUnit } = useSendDraftUi();
  const {
    strategies,
    selectedStrategy,
    selectedStrategyId,
    pickerOpen: strategyPickerOpen,
    openPicker: openStrategyPicker,
    closePicker: closeStrategyPicker,
    onSelectStrategy,
  } = useSendStrategyPicker();
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);
  const [showDecodedAddresses, setShowDecodedAddresses] = useState(false);
  const { currencySymbol, formatFromUsd, defaultFormattedZero } =
    useFiatDisplay();

  const form = useSendForm(
    spendableTokens,
    selectedStrategyId,
    route.params?.tokenId,
    allocationInputUnit,
    availableUsd,
  );
  const {
    amount,
    taxUsd,
    payerTotalUsd,
    taxFunding,
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
  const [accountNumber, setAccountNumberState] = useState(() => {
    if (!ethereumRecipient.trim() || !solanaRecipient.trim()) {
      return '';
    }

    try {
      return encodeWalletIdentity(
        ethereumRecipient.trim(),
        solanaRecipient.trim(),
      );
    } catch {
      return '';
    }
  });

  const totalLabel = availableLabel;
  const hasWallet = Boolean(ethereumAddress || solanaAddress);

  const taxLabel = formatFromUsd(taxUsd) ?? defaultFormattedZero;
  const payerTotalLabel =
    (payerTotalUsd != null ? formatFromUsd(payerTotalUsd) : null) ??
    defaultFormattedZero;
  const taxFundingChain = taxFunding
    ? getNetworkChain(taxFunding.token.network)
    : null;
  const showTaxEvm =
    taxFundingChain != null
      ? taxFundingChain === 'ethereum'
      : needsEthereumRecipient || Boolean(ethereumAddress);
  const showTaxSolana =
    taxFundingChain != null
      ? taxFundingChain === 'solana'
      : needsSolanaRecipient || Boolean(solanaAddress);

  const amountError =
    amount.trim() && insufficientFunds
      ? 'Insufficient funds for this amount (including service fee)'
      : amount.trim() && !form.amountValid
        ? 'Enter a valid amount'
        : null;

  const decodedAccountNumber = useMemo(
    () => tryDecodeWalletIdentity(accountNumber),
    [accountNumber],
  );

  const accountNumberError =
    accountNumber.trim() && !decodedAccountNumber
      ? 'Enter a valid account number'
      : null;

  const syncAccountNumberFromAddresses = useCallback(
    (nextEvm: string, nextSolana: string) => {
      const trimmedEvm = nextEvm.trim();
      const trimmedSolana = nextSolana.trim();
      const evmValid = isValidRecipientAddress(trimmedEvm, 'ethereum');
      const solanaValid = isValidRecipientAddress(trimmedSolana, 'solana');

      if (!trimmedEvm && !trimmedSolana) {
        setAccountNumberState('');
        return;
      }

      if (!evmValid || !solanaValid) {
        setAccountNumberState('');
        return;
      }

      try {
        setAccountNumberState(encodeWalletIdentity(trimmedEvm, trimmedSolana));
      } catch {
        setAccountNumberState('');
      }
    },
    [],
  );

  const setAccountNumber = useCallback(
    (value: string) => {
      setAccountNumberState(value);

      const decoded = tryDecodeWalletIdentity(value);
      if (!value.trim()) {
        setEthereumRecipient('');
        setSolanaRecipient('');
        return;
      }

      if (!decoded) {
        setEthereumRecipient('');
        setSolanaRecipient('');
        return;
      }

      setEthereumRecipient(decoded.evmAddress);
      setSolanaRecipient(decoded.solanaAddress);
    },
    [setEthereumRecipient, setSolanaRecipient],
  );

  const setDecodedEthereumRecipient = useCallback(
    (value: string) => {
      setEthereumRecipient(value);
      syncAccountNumberFromAddresses(value, solanaRecipient);
    },
    [setEthereumRecipient, solanaRecipient, syncAccountNumberFromAddresses],
  );

  const setDecodedSolanaRecipient = useCallback(
    (value: string) => {
      setSolanaRecipient(value);
      syncAccountNumberFromAddresses(ethereumRecipient, value);
    },
    [ethereumRecipient, setSolanaRecipient, syncAccountNumberFromAddresses],
  );

  useEffect(() => {
    updateSendDraft({ accountNumber: accountNumber.trim() });
  }, [accountNumber]);

  const onContinue = useCallback(() => {
    if (!canContinue || allocations.length === 0) {
      return;
    }

    navigation.navigate('confirmSend', {
      usdAmount: amount,
      ethereumRecipient: ethereumRecipient.trim() || undefined,
      solanaRecipient: solanaRecipient.trim() || undefined,
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
    solanaRecipient,
  ]);

  const goHome = usePopToHome();

  const onAddToken = useCallback(
    (tokenId: string) => {
      addAllocation(tokenId);
      setTokenPickerOpen(false);
    },
    [addAllocation],
  );

  const allocatedTokenIds = allocations.map((leg) => leg.token.id);
  const canAddToken = spendableTokens.some(
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
            <ActivityIndicator color="#166534" style={styles.loader} />
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
              <View style={styles.formBody}>
                <Text style={styles.label}>Account Number</Text>
                <View
                  style={[
                    styles.fieldRow,
                    accountNumberError ? styles.fieldRowError : null,
                  ]}
                >
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setAccountNumber}
                    placeholder="Paste account number"
                    placeholderTextColor="#86a894"
                    style={styles.fieldInput}
                    value={accountNumber}
                  />
                  {accountNumber.trim() ? (
                    <Pressable
                      accessibilityLabel="Clear account number"
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        setAccountNumber('');
                      }}
                      style={styles.clearButton}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="#86a894"
                      />
                    </Pressable>
                  ) : null}
                </View>
                {accountNumberError ? (
                  <Text style={styles.fieldError}>{accountNumberError}</Text>
                ) : null}
                <Pressable
                  accessibilityLabel={
                    showDecodedAddresses
                      ? 'Hide advanced'
                      : 'Show advanced'
                  }
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showDecodedAddresses }}
                  onPress={() => {
                    setShowDecodedAddresses((open) => !open);
                  }}
                  style={({ pressed }) => [
                    styles.decodedToggle,
                    pressed && styles.advancedTogglePressed,
                  ]}
                >
                  <Text style={styles.decodedToggleText}>Advanced</Text>
                  <Ionicons
                    name={showDecodedAddresses ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#5a7d6a"
                  />
                </Pressable>
                {showDecodedAddresses ? (
                  <View style={styles.decodedCard}>
                    <View style={styles.decodedGroup}>
                      <Text style={styles.decodedLabel}>EVM</Text>
                      <View style={styles.decodedInputRow}>
                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={setDecodedEthereumRecipient}
                          placeholder="Enter a valid account number"
                          placeholderTextColor="#86a894"
                          style={styles.decodedInput}
                          value={ethereumRecipient}
                        />
                        {ethereumRecipient.trim() ? (
                          <Pressable
                            accessibilityLabel="Clear EVM address"
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() => {
                              setDecodedEthereumRecipient('');
                            }}
                            style={styles.clearButton}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#86a894"
                            />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.decodedDivider} />
                    <View style={styles.decodedGroup}>
                      <Text style={styles.decodedLabel}>Solana</Text>
                      <View style={styles.decodedInputRow}>
                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={setDecodedSolanaRecipient}
                          placeholder="Enter a valid account number"
                          placeholderTextColor="#86a894"
                          style={styles.decodedInput}
                          value={solanaRecipient}
                        />
                        {solanaRecipient.trim() ? (
                          <Pressable
                            accessibilityLabel="Clear Solana address"
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() => {
                              setDecodedSolanaRecipient('');
                            }}
                            style={styles.clearButton}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#86a894"
                            />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ) : null}

                <View style={styles.balanceDivider} />
                <View
                  accessibilityLabel={`Available Balance: ${totalLabel}`}
                  style={[styles.fieldRow, styles.fieldRowDisabled, styles.balanceRow]}
                >
                  <Text style={styles.balanceLabel}>Available Balance:</Text>
                  <Text style={styles.balanceValue}>{totalLabel}</Text>
                </View>

                <Text style={styles.label}>Amount</Text>
                <View
                  style={[
                    styles.fieldRow,
                    amountError ? styles.fieldRowError : null,
                  ]}
                >
                  <Text style={styles.amountPrefix}>{currencySymbol}</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor="#86a894"
                    style={styles.fieldInput}
                    value={amount}
                  />
                </View>
                {amountError ? (
                  <Text style={styles.fieldError}>{amountError}</Text>
                ) : null}

                <TaxDetailsCollapsible
                  showEvm={showTaxEvm}
                  showSolana={showTaxSolana}
                  style={styles.taxSection}
                  taxLabel={taxLabel}
                />
                <View style={styles.payerTotalRow}>
                  <Text style={styles.payerTotalLabel}>Total</Text>
                  <Text style={styles.payerTotalValue}>
                    {payerTotalLabel}
                  </Text>
                </View>

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
                    color="#5a7d6a"
                  />
                </Pressable>

                {showAdvanced ? (
                  <SendAdvancedDetails
                    allocationInputUnit={allocationInputUnit}
                    allocationInputs={allocationInputs}
                    allocations={allocations}
                    canAddToken={canAddToken}
                    onAddToken={() => {
                      setTokenPickerOpen(true);
                    }}
                    onAllocationAmountChange={setAllocationAmount}
                    onAllocationInputUnitChange={setAllocationInputUnit}
                    onOpenStrategyPicker={openStrategyPicker}
                    onRemoveAllocation={removeAllocation}
                    selectedStrategy={selectedStrategy}
                    spendableTokens={spendableTokens}
                    taxFunding={taxFunding}
                  />
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
              </View>
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
        tokens={spendableTokens}
        visible={tokenPickerOpen}
      />
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
    color: '#166534',
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
    color: '#166534',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
  form: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  balanceRow: {
    marginTop: 12,
    paddingRight: 16,
  },
  balanceDivider: {
    marginTop: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#86d4a4',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5a7d6a',
    marginRight: 8,
  },
  balanceValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  formBody: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: '#fff',
    minHeight: 52,
  },
  fieldRowDisabled: {
    backgroundColor: '#dcfce7',
  },
  fieldRowError: {
    borderColor: '#fca5a5',
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: '#166534',
  },
  amountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
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
  taxSection: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    backgroundColor: '#dcfce7',
  },
  payerTotalRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    backgroundColor: '#dcfce7',
  },
  payerTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532d',
  },
  payerTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532d',
    fontVariant: ['tabular-nums'],
  },
  advancedToggle: {
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
    color: '#5a7d6a',
    marginRight: 4,
  },
  decodedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  decodedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    marginRight: 4,
  },
  decodedCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  decodedGroup: {
    gap: 8,
  },
  decodedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingLeft: 12,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 10,
    backgroundColor: '#f8fffa',
  },
  decodedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#86a894',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  decodedValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#166534',
  },
  decodedInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 16,
    color: '#166534',
  },
  decodedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginVertical: 10,
  },
  continueButton: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: '#166534',
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
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
});
