import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Modal,
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
import { SendTokenAllocations } from '@/components/SendAdvancedDetails';
import { SendConfigurationCollapsible } from '@/components/SendConfigurationCollapsible';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { useAppLayout } from '@/hooks/useAppLayout';
import { useAppTax } from '@/hooks/useAppTax';
import { useOpenFreshSend } from '@/hooks/useOpenFreshSend';
import { usePopToSend } from '@/hooks/usePopToSend';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useGasFunding } from '@/hooks/useGasFunding';
import { useGasSponsorship } from '@/hooks/useGasSponsorship';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { resetSendDraft, useSendDraft, useSendDraftUi } from '@/hooks/useSendDraft';
import { useSendAmountRecipientDisplay } from '@/hooks/useSendAmountRecipientDisplay';
import { useSendForm } from '@/hooks/useSendForm';
import { useSendPayment } from '@/hooks/useSendPayment';
import { useSendRecipientUsername } from '@/hooks/useSendRecipientUsername';
import { addRecentSendRecipient } from '@/hooks/useRecentSendRecipients';
import { useSendStatus } from '@/hooks/useSendStatus';
import { useSendStrategyPicker } from '@/hooks/useStrategyPicker';
import { useSendTip } from '@/hooks/useSendTip';
import { useSendSpendableTokens } from '@/hooks/useSendSpendableTokens';
import { useSendVaultUsdc } from '@/hooks/useSendVaultUsdc';
import { useVaultUsdcFundingSplits } from '@/hooks/useVaultUsdcFundingSplits';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { buildPaymentLegsWithTax } from '@/lib/send/buildPaymentLegsWithTax';
import { formatSendError } from '@/lib/send/formatSendError';
import { resolveRewardPaymentUsd } from '@/lib/rewardPoints';
import { isUnpricedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { HomeStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Review + execute a multi-token payment prepared on the Send screen.
 */
export function ConfirmSendScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { isAdvanced } = useAppLayout();

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { refresh, ...sendSpendable } = useSendSpendableTokens();
  const {
    tokens,
    loading,
    ready,
    spendableTokens,
    availableUsd,
    availableBalanceLoading,
  } = sendSpendable;
  const { sendPayment, sending } = useSendPayment();
  const { error, clearStatus, setError } = useSendStatus();
  const {
    accountNumber,
    recipientName,
    recipientProfilePhotoUrl,
    recipientIsFarcaster,
    recipientIsEns,
  } = useSendDraft();
  const recipientUsername = useSendRecipientUsername();
  const { tip, tipUsd, setTip, setTipPercent } = useSendTip();
  const { gasSponsorship, setGasSponsorship } = useGasSponsorship();
  const {
    evmAddress: taxEvmAddress,
    solanaAddress: taxSolanaAddress,
    rate: taxRate,
  } = useAppTax(gasSponsorship);
  const { allocationInputUnit, setAllocationInputUnit, broadcastMode, setBroadcastMode } =
    useSendDraftUi();
  const { enabled: useVaultUsdcForSend } = useSendVaultUsdc();
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
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const popToSend = usePopToSend();
  const openFreshSend = useOpenFreshSend();
  const {
    formatFromUsd,
    currencySymbol,
  } = useFiatDisplay();

  const form = useSendForm(
    tokens,
    spendableTokens,
    selectedStrategyId,
    undefined,
    allocationInputUnit,
    availableUsd,
    tipUsd,
  );
  const {
    amount,
    requestedUsd,
    taxUsd,
    payerTotalUsd,
    taxFunding,
    allocations,
    allocationInputs,
    ethereumRecipient,
    solanaRecipient,
    resolvedEthereumRecipient,
    resolvedSolanaRecipient,
    recipientsValid,
    insufficientFunds,
    filledUsd,
    canContinue,
    setAllocationAmount,
    removeAllocation,
    addAllocation,
  } = form;

  const gasFunding = useGasFunding(tokens, allocations, taxFunding);
  const vaultUsdcFundingSplits = useVaultUsdcFundingSplits(
    allocations,
    taxFunding,
  );

  const trimmedEthereum = resolvedEthereumRecipient;
  const trimmedSolana = resolvedSolanaRecipient;
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

  const baseUsd =
    requestedUsd != null ? Math.max(0, requestedUsd - tipUsd) : null;
  const taxLabel = taxUsd > 0 ? formatFromUsd(taxUsd) : null;
  const totalLabel =
    (payerTotalUsd != null ? formatFromUsd(payerTotalUsd) : null) ??
    (requestedUsd != null ? formatFromUsd(requestedUsd) : null) ??
    `${currencySymbol}${amount || '0'}`;
  const showInsufficientFunds =
    insufficientFunds && !availableBalanceLoading;
  const availableLabel = showInsufficientFunds
    ? formatFromUsd(filledUsd)
    : null;

  const taxFundingChain = taxFunding
    ? getNetworkChain(taxFunding.token.network)
    : null;

  const onTipPercent = useCallback(
    (percent: number) => {
      if (baseUsd == null || !(baseUsd > 0)) {
        return;
      }
      setTipPercent(baseUsd, percent);
    },
    [baseUsd, setTipPercent],
  );

  const canSend =
    canContinue && allocations.length > 0 && !availableBalanceLoading;

  const hasPositiveLeg = allocations.some((leg) => leg.amountRaw > 0n);

  const invalidReason = availableBalanceLoading
    ? null
    : showInsufficientFunds
      ? 'Insufficient funds for this payment.'
      : allocations.length === 0 || !hasPositiveLeg
        ? 'Add at least one token with an amount in advanced details.'
        : !recipientsValid
          ? 'Recipient address is invalid.'
          : !canContinue
            ? 'Complete payment details to continue.'
            : null;

  const onConfirm = useCallback(() => {
    if (!canSend || sending) {
      return;
    }

    clearStatus();

    void (async () => {
      try {
        const paymentLegs = buildPaymentLegsWithTax({
          allocations,
          ethereumRecipient: trimmedEthereum,
          solanaRecipient: trimmedSolana,
          spendableTokens,
          taxEvmAddress,
          taxSolanaAddress,
          taxRate,
          skipSelfGasReserve: gasSponsorship,
        });
        const outcome = await sendPayment(
          paymentLegs.map((leg) => ({
            token: leg.token,
            recipient: leg.recipient,
            amountRaw: leg.amountRaw,
            amountFormatted: leg.amountFormatted,
            isTax: leg.isTax,
          })),
          {
            broadcastMode,
            useVaultUsdc: useVaultUsdcForSend,
            paymentUsd: resolveRewardPaymentUsd({
              baseUsd,
              filledUsd,
              allocations,
            }),
          },
        );
        addRecentSendRecipient({
          identityId: accountNumber.trim() || null,
          evmAddress: trimmedEthereum || null,
          solanaAddress: trimmedSolana || null,
          username: recipientUsername,
          name: recipientName,
          profilePhotoUrl: recipientProfilePhotoUrl,
          isFarcaster: recipientIsFarcaster,
          isEns: recipientIsEns,
        });
        resetSendDraft();
        refresh();
        navigation.navigate('sent', {
          usdLabel: totalLabel,
          recipientLabel: primaryLabel ?? undefined,
          recipientProfilePhotoUrl,
          recipientUsername,
          recipientIsFarcaster,
          recipientIsEns,
          rewardAmount: outcome.rewardAmount,
          rewardHash: outcome.rewardHash,
          rewardFailed: outcome.rewardFailed,
          legs: outcome.legs.map((result) => ({
            hash: result.hash,
            amount: result.amount,
            symbol: result.symbol,
            network: result.network,
            networkLabel: result.networkLabel,
            tokenName: result.tokenName,
            logoUrl: result.logoUrl,
            isTax: result.isTax === true,
          })),
        });
      } catch (err) {
        console.error('Send failed', err);
        setError(formatSendError(err));
      }
    })();
  }, [
    allocations,
    accountNumber,
    baseUsd,
    broadcastMode,
    canSend,
    clearStatus,
    filledUsd,
    gasSponsorship,
    navigation,
    primaryLabel,
    recipientIsFarcaster,
    recipientIsEns,
    recipientName,
    recipientProfilePhotoUrl,
    recipientUsername,
    refresh,
    sendPayment,
    sending,
    setError,
    spendableTokens,
    taxEvmAddress,
    taxRate,
    taxSolanaAddress,
    totalLabel,
    trimmedEthereum,
    trimmedSolana,
    useVaultUsdcForSend,
  ]);

  const onCancelPress = useCallback(() => {
    if (sending) {
      return;
    }
    setCancelConfirmOpen(true);
  }, [sending]);

  const onDismissCancelConfirm = useCallback(() => {
    setCancelConfirmOpen(false);
  }, []);

  const onConfirmExit = useCallback(() => {
    setCancelConfirmOpen(false);
    openFreshSend();
  }, [openFreshSend]);

  const goToSend = popToSend;

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
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goToSend}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton accessibilityLabel="Back" onPress={goToSend} />
          )}
          <Text style={styles.topBarTitle}>Confirm</Text>
          <View style={styles.topBarSpacer} />
        </View>

        {!ready || (loading && tokens.length === 0) ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.body} style={styles.flex}>
            {hasRecipient && primaryLabel ? (
              <View style={styles.toSection}>
                <Text style={styles.recipientLabel}>{recipientFieldLabel}</Text>
                <View style={styles.recipientRow}>
                  <Avatar
                    label={primaryLabel}
                    photoUrl={recipientProfilePhotoUrl}
                    seed={recipientUsername ?? primaryLabel}
                    size={40}
                    showFarcasterBadge={recipientIsFarcaster}
                    showEnsBadge={recipientIsEns}
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
            {hasRecipient && primaryLabel ? (
              <View style={styles.toDivider} />
            ) : null}

            {availableLabel ? (
              <Text style={styles.availableUsd}>
                Available Balance: {availableLabel}
              </Text>
            ) : null}

            <View style={styles.tipSection}>
              <View style={styles.tipLabelRow}>
                <Text style={styles.tipLabel}>Additional amount</Text>
                <View style={styles.tipPercentRow}>
                  {([10, 15, 20] as const).map((percent) => (
                    <Pressable
                      key={percent}
                      accessibilityLabel={`Add ${percent} percent tip`}
                      accessibilityRole="button"
                      disabled={baseUsd == null || !(baseUsd > 0)}
                      onPress={() => {
                        onTipPercent(percent);
                      }}
                      style={({ pressed }) => [
                        styles.tipPercentButton,
                        (baseUsd == null || !(baseUsd > 0)) &&
                        styles.tipPercentButtonDisabled,
                        pressed &&
                        baseUsd != null &&
                        baseUsd > 0 &&
                        styles.tipPercentButtonPressed,
                      ]}
                    >
                      <Text style={styles.tipPercentButtonText}>
                        {percent}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.tipFieldRow}>
                <Text style={styles.tipPrefix}>{currencySymbol}</Text>
                <TextInput
                  accessibilityLabel="Additional amount"
                  keyboardType="decimal-pad"
                  onChangeText={setTip}
                  placeholder="0"
                  placeholderTextColor="#86a894"
                  style={styles.tipInput}
                  value={tip}
                />
              </View>
            </View>

            {isAdvanced ? (
              <View style={styles.tokensPanel}>
                <SendTokenAllocations {...tokenAllocationProps} />
              </View>
            ) : null}

            {taxLabel ? (
              <TaxDetailsCollapsible
                gasSponsorship={gasSponsorship}
                showEvm={taxFundingChain === 'ethereum'}
                showSolana={taxFundingChain === 'solana'}
                taxLabel={taxLabel}
              />
            ) : null}

            <Text style={styles.heroUsd}>{totalLabel}</Text>

            <SendConfigurationCollapsible
              broadcastMode={broadcastMode}
              gasSponsorship={gasSponsorship}
              includeTokenAllocations={!isAdvanced}
              onBroadcastModeChange={setBroadcastMode}
              onGasSponsorshipChange={setGasSponsorship}
              {...tokenAllocationProps}
            />

            {invalidReason ? (
              <Text style={styles.error}>{invalidReason}</Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={sending}
                onPress={onCancelPress}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  sending && styles.secondaryButtonDisabled,
                  pressed && !sending && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!canSend || sending}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.actionPrimary,
                  (!canSend || sending) && styles.primaryButtonDisabled,
                  pressed &&
                  canSend &&
                  !sending &&
                  styles.primaryButtonPressed,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color={colors.primaryText} />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>

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

      <Modal
        animationType="fade"
        transparent
        visible={cancelConfirmOpen}
        onRequestClose={onDismissCancelConfirm}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Changes not saved</Text>
            <Text style={styles.modalBody}>
              If you exit without saving, all entered data on this page will be
              lost. Would you like to proceed?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onDismissCancelConfirm}
                style={({ pressed }) => [
                  styles.modalSecondaryButton,
                  pressed && styles.modalSecondaryButtonPressed,
                ]}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onConfirmExit}
                style={({ pressed }) => [
                  styles.modalPrimaryButton,
                  pressed && styles.modalPrimaryButtonPressed,
                ]}
              >
                <Text style={styles.modalPrimaryButtonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  body: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 28,
    alignItems: 'center',
  },
  heroUsd: {
    marginTop: 24,
    fontSize: 36,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.6,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  availableUsd: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '600',
    color: c.danger,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
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
  tipSection: {
    marginTop: 28,
    alignSelf: 'stretch',
  },
  tipLabelRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tipPercentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tipPercentButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.inputBorder,
    backgroundColor: c.surface,
  },
  tipPercentButtonDisabled: {
    opacity: 0.45,
  },
  tipPercentButtonPressed: {
    opacity: 0.85,
  },
  tipPercentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.primary,
  },
  tipFieldRow: {
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
  tipPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
    marginRight: 4,
  },
  tipInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: c.primary,
  },
  toSection: {
    alignSelf: 'stretch',
  },
  toDivider: {
    alignSelf: 'stretch',
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#86d4a4',
    marginBottom: 28,
  },
  recipientLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recipientValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '600',
    color: c.primary,
    fontVariant: ['tabular-nums'],
  },
  error: {
    marginTop: 16,
    fontSize: 24,
    lineHeight: 32,
    color: c.danger,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  actions: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.inputBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  secondaryButtonDisabled: {
    opacity: 0.45,
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: c.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: c.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionPrimary: {
    flex: 1,
    marginTop: 0,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 101, 52, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.primary,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.inputBorder,
    backgroundColor: c.surface,
  },
  modalSecondaryButtonPressed: {
    opacity: 0.85,
  },
  modalSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
  },
  modalPrimaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: c.primary,
  },
  modalPrimaryButtonPressed: {
    opacity: 0.85,
  },
  modalPrimaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primaryText,
  },
});
}
