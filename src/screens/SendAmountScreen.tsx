import { useCallback, useEffect, useState } from 'react';
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

import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { SendAdvancedDetails } from '@/components/SendAdvancedDetails';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendAmountRecipientDisplay } from '@/hooks/useSendAmountRecipientDisplay';
import { useClearSendRecipientOnBack } from '@/hooks/useClearSendRecipientOnBack';
import {
  updateSendDraft,
  useSendDraft,
  useSendDraftUi,
} from '@/hooks/useSendDraft';
import { useSendForm } from '@/hooks/useSendForm';
import { useSendRecipientUsername } from '@/hooks/useSendRecipientUsername';
import { useSendStrategyPicker } from '@/hooks/useStrategyPicker';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useSpendableTokens } from '@/hooks/useSpendableTokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { getNetworkChain } from '@/lib/alchemy/networks';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Send step 2 — enter amount and review allocation / tax before confirm.
 */
export function SendAmountScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sendAmount'>>();
  const { tokens, loading, ready, ethereumAddress, solanaAddress } =
    useTokenBalances();
  const { spendableTokens, availableUsd, availableLabel } =
    useSpendableTokens(tokens);
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const { allocationInputUnit, setAllocationInputUnit, broadcastMode, setBroadcastMode } =
    useSendDraftUi();
  const { accountNumber, recipientName, recipientProfilePhotoUrl, recipientIsFarcaster } =
    useSendDraft();
  const recipientUsername = useSendRecipientUsername();
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
  const { currencySymbol, formatFromUsd, defaultFormattedZero } =
    useFiatDisplay();

  useEffect(() => {
    const usdAmount = route.params?.usdAmount?.trim();
    if (usdAmount) {
      updateSendDraft({ amount: usdAmount, amountLocked: true });
    }
  }, [route.params?.usdAmount]);

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
    insufficientFunds,
    canContinue,
    setAmount,
    setAllocationAmount,
    removeAllocation,
    addAllocation,
  } = form;

  const {
    hasRecipient,
    primaryLabel,
    recipientFieldLabel,
  } = useSendAmountRecipientDisplay({
    accountNumber,
    ethereumRecipient,
    solanaRecipient,
    username: recipientUsername,
    name: recipientName,
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

  const { onBack } = useClearSendRecipientOnBack();

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
                accessibilityLabel="Back"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onBack}
                style={({ pressed }) => [
                  styles.webBack,
                  pressed && styles.webBackPressed,
                ]}
              >
                <Text style={styles.webBackText}>Back</Text>
              </Pressable>
            ) : (
              <BackButton accessibilityLabel="Back" onPress={onBack} />
            )}
            <Text style={styles.topBarTitle}>Amount</Text>
            <View style={styles.topBarSpacer} />
          </View>

          {!ready || (loading && tokens.length === 0) ? (
            <ActivityIndicator color="#D33D3D" style={styles.loader} />
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
                {hasRecipient && primaryLabel ? (
                  <View style={styles.recipientSection}>
                    <Text style={styles.label}>{recipientFieldLabel}</Text>
                    <View
                      style={[styles.fieldRow, styles.fieldRowDisabled]}
                    >
                      <Avatar
                        label={primaryLabel}
                        photoUrl={recipientProfilePhotoUrl}
                        seed={recipientUsername ?? primaryLabel}
                        size={32}
                        showFarcasterBadge={recipientIsFarcaster}
                        style={styles.recipientAvatar}
                      />
                      <Text
                        style={styles.recipientValue}
                        selectable
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {primaryLabel}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View
                  accessibilityLabel={`Available Balance: ${totalLabel}`}
                  style={[
                    styles.fieldRow,
                    styles.fieldRowDisabled,
                    styles.balanceRow,
                  ]}
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
                    placeholderTextColor="#C37A7A"
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
                    color="#9B5A5A"
                  />
                </Pressable>

                {showAdvanced ? (
                  <SendAdvancedDetails
                    allocationInputUnit={allocationInputUnit}
                    allocationInputs={allocationInputs}
                    allocations={allocations}
                    broadcastMode={broadcastMode}
                    canAddToken={canAddToken}
                    onAddToken={() => {
                      setTokenPickerOpen(true);
                    }}
                    onAllocationAmountChange={setAllocationAmount}
                    onAllocationInputUnitChange={setAllocationInputUnit}
                    onBroadcastModeChange={setBroadcastMode}
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
    backgroundColor: '#FFF4E6',
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
    color: '#D33D3D',
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
    color: '#D33D3D',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#C37A7A',
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
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9B5A5A',
    marginRight: 8,
  },
  balanceValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  formBody: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  recipientSection: {
    width: '100%',
    marginBottom: 4,
  },
  recipientAvatar: {
    marginRight: 4,
  },
  recipientValue: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#9B5A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3A089',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: '#fff',
    minHeight: 52,
  },
  fieldRowDisabled: {
    backgroundColor: '#FFDCC8',
  },
  fieldRowError: {
    borderColor: '#fca5a5',
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: '#D33D3D',
  },
  amountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
    marginRight: 4,
  },
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: '#b91c1c',
  },
  taxSection: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F3A089',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    backgroundColor: '#FFDCC8',
  },
  payerTotalRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3A089',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    backgroundColor: '#FFDCC8',
  },
  payerTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A1E1E',
  },
  payerTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A1E1E',
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
    color: '#9B5A5A',
    marginRight: 4,
  },
  continueButton: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: '#D33D3D',
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
    color: '#FFF4E6',
    fontSize: 16,
    fontWeight: '600',
  },
});
