import { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BalanceSkeleton } from '@/components/BalanceSkeleton';
import { BackButton } from '@/components/BackButton';
import { SendTokenAllocations } from '@/components/SendAdvancedDetails';
import { SendConfigurationCollapsible } from '@/components/SendConfigurationCollapsible';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { useAppLayout } from '@/hooks/useAppLayout';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useGasFunding } from '@/hooks/useGasFunding';
import { useGasSponsorship } from '@/hooks/useGasSponsorship';
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
import { useSendSpendableTokens } from '@/hooks/useSendSpendableTokens';
import { useVaultUsdcFundingSplits } from '@/hooks/useVaultUsdcFundingSplits';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isUnpricedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { HomeStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Send step 2 — enter amount and review allocation / tax before confirm.
 */
export function SendAmountScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { isAdvanced } = useAppLayout();

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sendAmount'>>();
  const {
    tokens,
    loading,
    ready,
    ethereumAddress,
    solanaAddress,
    spendableTokens,
    availableUsd,
    availableLabel,
    availableBalanceLoading,
  } = useSendSpendableTokens();
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
  const { currencySymbol, formatFromUsd, defaultFormattedZero, parseDisplayInputToUsd } =
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

  const gasFunding = useGasFunding(tokens, allocations, taxFunding);
  const vaultUsdcFundingSplits = useVaultUsdcFundingSplits(
    allocations,
    taxFunding,
  );

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
    taxFundingChain == null || taxFundingChain === 'ethereum';
  const showTaxSolana =
    taxFundingChain == null || taxFundingChain === 'solana';

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
  const tokenAllocationProps = {
    allocationInputUnit,
    allocationInputs,
    allocations,
    canAddToken,
    gasFunding,
    onAddToken: () => {
      setTokenPickerOpen(true);
    },
    onAllocationAmountChange: setAllocationAmount,
    onAllocationInputUnitChange: setAllocationInputUnit,
    onOpenStrategyPicker: openStrategyPicker,
    onRemoveAllocation: removeAllocation,
    selectedStrategy,
    spendableTokens,
    taxFunding,
    vaultUsdcFundingSplits,
  };

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
            <ActivityIndicator color={colors.primary} style={styles.loader} />
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
                  accessibilityLabel={
                    availableBalanceLoading
                      ? 'Loading available balance'
                      : `Available Balance: ${totalLabel}`
                  }
                  style={[
                    styles.fieldRow,
                    styles.fieldRowDisabled,
                    styles.balanceRow,
                  ]}
                >
                  <Text style={styles.balanceLabel}>Available Balance:</Text>
                  {availableBalanceLoading ? (
                    <View style={styles.balanceValueSkeletonWrap}>
                      <BalanceSkeleton
                        accessibilityLabel="Loading available balance"
                        height={20}
                        width={88}
                      />
                    </View>
                  ) : (
                    <Text style={styles.balanceValue}>{totalLabel}</Text>
                  )}
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

                {isAdvanced ? (
                  <View style={styles.tokensPanel}>
                    <SendTokenAllocations {...tokenAllocationProps} />
                  </View>
                ) : null}

                <TaxDetailsCollapsible
                  gasSponsorship={gasSponsorship}
                  showEvm={showTaxEvm}
                  showSolana={showTaxSolana}
                  taxLabel={taxLabel}
                />
                <View style={styles.payerTotalRow}>
                  <Text style={styles.payerTotalLabel}>Total</Text>
                  <Text style={styles.payerTotalValue}>
                    {payerTotalLabel}
                  </Text>
                </View>

                <SendConfigurationCollapsible
                  broadcastMode={broadcastMode}
                  gasSponsorship={gasSponsorship}
                  includeTokenAllocations={!isAdvanced}
                  onBroadcastModeChange={setBroadcastMode}
                  onGasSponsorshipChange={setGasSponsorship}
                  {...tokenAllocationProps}
                />

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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
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
    color: c.primary,
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
    color: c.primary,
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: c.textSubtle,
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
  balanceValueSkeletonWrap: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
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
    color: c.primary,
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  fieldRowError: {
    borderColor: c.dangerBorder,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: c.primary,
  },
  amountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
    marginRight: 4,
  },
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: c.danger,
  },
  tokensPanel: {
    marginTop: 16,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: c.rowBorder,
    borderRadius: 12,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  payerTotalRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    backgroundColor: c.surfaceMuted,
  },
  payerTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
  },
  payerTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },

  continueButton: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: c.primary,
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
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  continueHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: c.textMuted,
    textAlign: 'center',
  },
});
}
