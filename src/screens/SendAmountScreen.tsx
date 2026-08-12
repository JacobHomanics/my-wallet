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
import { useGasFunding } from '@/hooks/useGasFunding';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendAmountRecipientDisplay } from '@/hooks/useSendAmountRecipientDisplay';
import { useClearSendRecipientOnBack } from '@/hooks/useClearSendRecipientOnBack';
import { useGasSponsorship } from '@/hooks/useGasSponsorship';
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
import { isUnpricedToken } from '@/lib/alchemy/fetchTokensByAddress';
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
  const { gasSponsorship, setGasSponsorship } = useGasSponsorship();
  const { accountNumber, recipientName, recipientProfilePhotoUrl, recipientIsFarcaster, recipientIsEns } =
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
  const { currencySymbol, formatFromUsd, formatServiceFeeFromUsd, defaultFormattedZero, parseDisplayInputToUsd } =
    useFiatDisplay();

  useEffect(() => {
    const usdAmount = route.params?.usdAmount?.trim();
    if (usdAmount) {
      updateSendDraft({ amount: usdAmount, amountLocked: true });
    }
  }, [route.params?.usdAmount]);

  const form = useSendForm(
    tokens,
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
    ethereumRecipient,
    solanaRecipient,
    resolvedEthereumRecipient,
    resolvedSolanaRecipient,
    insufficientFunds,
    canContinue,
    continueBlockedReason,
    isManualPayment,
    setAmount,
    setAllocationAmount,
    removeAllocation,
    addAllocation,
  } = form;

  const gasFunding = useGasFunding(tokens, spendableTokens, allocations, taxFunding);

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

  const taxLabel = taxUsd > 0 ? formatServiceFeeFromUsd(taxUsd) : null;
  const payerTotalLabel =
    (payerTotalUsd != null ? formatFromUsd(payerTotalUsd) : null) ??
    defaultFormattedZero;
  const taxFundingChain = taxFunding
    ? getNetworkChain(taxFunding.token.network)
    : null;

  const isZeroAmount = (parseDisplayInputToUsd(amount) ?? 0) === 0;
  const amountError = insufficientFunds
    ? 'Insufficient funds for this payment (including service fee and gas)'
    : amount.trim() && !isZeroAmount && !isManualPayment && !form.amountValid
      ? 'Enter a valid amount'
      : null;

  const onContinue = useCallback(() => {
    if (!canContinue || allocations.length === 0) {
      return;
    }

    navigation.navigate('confirmSend', {
      usdAmount: amount,
      ethereumRecipient: resolvedEthereumRecipient || undefined,
      solanaRecipient: resolvedSolanaRecipient || undefined,
      legs: allocations.map((leg) => ({
        tokenId: leg.token.id,
        amount: leg.amountFormatted,
      })),
    });
  }, [
    amount,
    allocations,
    canContinue,
    resolvedEthereumRecipient,
    resolvedSolanaRecipient,
    navigation,
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
  const pickerTokens = tokens.filter((token) => {
    if (token.rawBalance <= 0n || allocatedTokenIds.includes(token.id)) {
      return false;
    }
    if (isUnpricedToken(token)) {
      return true;
    }
    const spendable = spendableTokens.find((item) => item.id === token.id);
    return spendable != null && spendable.rawBalance > 0n;
  });
  const canAddToken = pickerTokens.length > 0;

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
                        showEnsBadge={recipientIsEns}
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
                    placeholderTextColor="#86a894"
                    style={styles.fieldInput}
                    value={amount}
                  />
                </View>
                {amountError ? (
                  <Text style={styles.fieldError}>{amountError}</Text>
                ) : null}

                {taxLabel ? (
                  <TaxDetailsCollapsible
                    gasSponsorship={gasSponsorship}
                    showEvm={taxFundingChain === 'ethereum'}
                    showRatePercent={false}
                    showSolana={taxFundingChain === 'solana'}
                    taxLabel={taxLabel}
                  />
                ) : null}
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
                    broadcastMode={broadcastMode}
                    canAddToken={canAddToken}
                    gasFunding={gasFunding}
                    gasSponsorship={gasSponsorship}
                    onAddToken={() => {
                      setTokenPickerOpen(true);
                    }}
                    onAllocationAmountChange={setAllocationAmount}
                    onAllocationInputUnitChange={setAllocationInputUnit}
                    onBroadcastModeChange={setBroadcastMode}
                    onGasSponsorshipChange={setGasSponsorship}
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
                {!canContinue && continueBlockedReason ? (
                  <Text style={styles.continueHint}>{continueBlockedReason}</Text>
                ) : null}
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
        tokens={pickerTokens}
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
    color: '#166534',
    fontVariant: ['tabular-nums'],
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
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: '#b91c1c',
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
  continueHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
    textAlign: 'center',
  },
});
