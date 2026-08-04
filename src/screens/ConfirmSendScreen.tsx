import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

import { BackButton } from '@/components/BackButton';
import { SendAdvancedDetails } from '@/components/SendAdvancedDetails';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { useAppTax } from '@/hooks/useAppTax';
import { useOpenFreshSend } from '@/hooks/useOpenFreshSend';
import { usePopToSend } from '@/hooks/usePopToSend';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { resetSendDraft, useSendDraft, useSendDraftUi } from '@/hooks/useSendDraft';
import { useSendForm } from '@/hooks/useSendForm';
import { useSendPayment } from '@/hooks/useSendPayment';
import { useSendStatus } from '@/hooks/useSendStatus';
import { useSendStrategyPicker } from '@/hooks/useStrategyPicker';
import { useSendTip } from '@/hooks/useSendTip';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useSpendableTokens } from '@/hooks/useSpendableTokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { buildPaymentLegsWithTax } from '@/lib/send/buildPaymentLegsWithTax';
import { formatSendError } from '@/lib/send/formatSendError';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Review + execute a multi-token payment prepared on the Send screen.
 */
export function ConfirmSendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { tokens, loading, ready, refresh } = useTokenBalances();
  const { spendableTokens, availableUsd } = useSpendableTokens(tokens);
  const { sendPayment, sending } = useSendPayment();
  const { error, clearStatus, setError } = useSendStatus();
  const { copy, isCopied } = useCopyToClipboard();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const {
    showAdvanced: showRecipientAdvanced,
    toggleAdvanced: toggleRecipientAdvanced,
  } = useShowAdvanced();
  const { accountNumber } = useSendDraft();
  const { tip, tipUsd, setTip, setTipPercent } = useSendTip();
  const {
    evmAddress: taxEvmAddress,
    solanaAddress: taxSolanaAddress,
    rate: taxRate,
  } = useAppTax();
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
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const popToSend = usePopToSend();
  const openFreshSend = useOpenFreshSend();
  const {
    formatFromUsd,
    currencySymbol,
  } = useFiatDisplay();

  const form = useSendForm(
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
    needsEthereumRecipient,
    needsSolanaRecipient,
    ethereumRecipient,
    solanaRecipient,
    recipientsValid,
    amountValid,
    insufficientFunds,
    filledUsd,
    canContinue,
    setAllocationAmount,
    removeAllocation,
    addAllocation,
  } = form;

  const trimmedEthereum = ethereumRecipient.trim();
  const trimmedSolana = solanaRecipient.trim();
  const trimmedAccountNumber = accountNumber.trim();

  const baseUsd =
    requestedUsd != null ? Math.max(0, requestedUsd - tipUsd) : null;
  const taxLabel = taxUsd > 0 ? formatFromUsd(taxUsd) : null;
  const totalLabel =
    (payerTotalUsd != null ? formatFromUsd(payerTotalUsd) : null) ??
    (requestedUsd != null ? formatFromUsd(requestedUsd) : null) ??
    `${currencySymbol}${amount || '0'}`;
  const availableLabel =
    insufficientFunds ? formatFromUsd(filledUsd) : null;

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

  const canSend = canContinue && allocations.length > 0;

  const invalidReason =
    insufficientFunds || (amountValid && allocations.length === 0)
      ? 'Insufficient funds for this payment.'
      : allocations.length === 0
        ? 'Nothing to send. Go back and enter an amount.'
        : !recipientsValid
          ? 'Recipient address is invalid.'
          : !canContinue
            ? 'Enter a valid amount and recipients to continue.'
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
        });
        const results = await sendPayment(
          paymentLegs.map((leg) => ({
            token: leg.token,
            recipient: leg.recipient,
            amountRaw: leg.amountRaw,
            amountFormatted: leg.amountFormatted,
            isTax: leg.isTax,
          })),
        );
        resetSendDraft();
        refresh();
        navigation.navigate('sent', {
          usdLabel: totalLabel,
          legs: results.map((result) => ({
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
    canSend,
    clearStatus,
    navigation,
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
  const canAddToken = spendableTokens.some(
    (token) =>
      token.rawBalance > 0n && !allocatedTokenIds.includes(token.id),
  );

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
          <ActivityIndicator color="#166534" style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.body} style={styles.flex}>
            {trimmedAccountNumber ||
              needsEthereumRecipient ||
              needsSolanaRecipient ||
              trimmedEthereum ||
              trimmedSolana ? (
              <View style={styles.toSection}>
                {trimmedAccountNumber ? (
                  <>
                    <Text style={styles.recipientLabel}>To</Text>
                    <View style={styles.recipientValueRow}>
                      <Text style={styles.recipientValue} selectable>
                        {formatWalletAddress(trimmedAccountNumber, 10, 8)}
                      </Text>
                      <Pressable
                        accessibilityLabel={
                          isCopied('account-number')
                            ? 'Account number copied'
                            : 'Copy account number'
                        }
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => {
                          void copy(trimmedAccountNumber, 'account-number');
                        }}
                        style={({ pressed }) => [
                          styles.copyButton,
                          pressed && styles.copyButtonPressed,
                        ]}
                      >
                        <Ionicons
                          name={
                            isCopied('account-number')
                              ? 'checkmark'
                              : 'copy-outline'
                          }
                          size={18}
                          color={
                            isCopied('account-number') ? '#15803d' : '#166534'
                          }
                        />
                      </Pressable>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: showRecipientAdvanced }}
                      onPress={toggleRecipientAdvanced}
                      style={({ pressed }) => [
                        styles.recipientAdvancedToggle,
                        pressed && styles.advancedTogglePressed,
                      ]}
                    >
                      <Text style={styles.recipientAdvancedToggleText}>
                        Advanced
                      </Text>
                      <Ionicons
                        name={
                          showRecipientAdvanced ? 'chevron-up' : 'chevron-down'
                        }
                        size={16}
                        color="#5a7d6a"
                      />
                    </Pressable>
                    {showRecipientAdvanced ? (
                      <View style={styles.decodedCard}>
                        {needsEthereumRecipient || trimmedEthereum ? (
                          <View style={styles.decodedGroup}>
                            <Text style={styles.decodedLabel}>EVM</Text>
                            <View style={styles.decodedValueRow}>
                              <Text style={styles.decodedValue} selectable>
                                {trimmedEthereum || '—'}
                              </Text>
                              {trimmedEthereum ? (
                                <Pressable
                                  accessibilityLabel={
                                    isCopied('evm')
                                      ? 'EVM address copied'
                                      : 'Copy EVM address'
                                  }
                                  accessibilityRole="button"
                                  hitSlop={8}
                                  onPress={() => {
                                    void copy(trimmedEthereum, 'evm');
                                  }}
                                  style={({ pressed }) => [
                                    styles.copyButton,
                                    pressed && styles.copyButtonPressed,
                                  ]}
                                >
                                  <Ionicons
                                    name={
                                      isCopied('evm')
                                        ? 'checkmark'
                                        : 'copy-outline'
                                    }
                                    size={18}
                                    color={
                                      isCopied('evm') ? '#15803d' : '#5a7d6a'
                                    }
                                  />
                                </Pressable>
                              ) : null}
                            </View>
                          </View>
                        ) : null}
                        {(needsEthereumRecipient || trimmedEthereum) &&
                          (needsSolanaRecipient || trimmedSolana) ? (
                          <View style={styles.decodedDivider} />
                        ) : null}
                        {needsSolanaRecipient || trimmedSolana ? (
                          <View style={styles.decodedGroup}>
                            <Text style={styles.decodedLabel}>Solana</Text>
                            <View style={styles.decodedValueRow}>
                              <Text style={styles.decodedValue} selectable>
                                {trimmedSolana || '—'}
                              </Text>
                              {trimmedSolana ? (
                                <Pressable
                                  accessibilityLabel={
                                    isCopied('solana')
                                      ? 'Solana address copied'
                                      : 'Copy Solana address'
                                  }
                                  accessibilityRole="button"
                                  hitSlop={8}
                                  onPress={() => {
                                    void copy(trimmedSolana, 'solana');
                                  }}
                                  style={({ pressed }) => [
                                    styles.copyButton,
                                    pressed && styles.copyButtonPressed,
                                  ]}
                                >
                                  <Ionicons
                                    name={
                                      isCopied('solana')
                                        ? 'checkmark'
                                        : 'copy-outline'
                                    }
                                    size={18}
                                    color={
                                      isCopied('solana') ? '#15803d' : '#5a7d6a'
                                    }
                                  />
                                </Pressable>
                              ) : null}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.toLabel}>To</Text>
                    {needsEthereumRecipient || trimmedEthereum ? (
                      <View style={styles.toAddressRow}>
                        <Text style={styles.toChainLabel}>EVM</Text>
                        <Text style={styles.toAddress} selectable>
                          {trimmedEthereum
                            ? formatWalletAddress(trimmedEthereum)
                            : '—'}
                        </Text>
                        {trimmedEthereum ? (
                          <Pressable
                            accessibilityLabel={
                              isCopied('evm')
                                ? 'EVM address copied'
                                : 'Copy EVM address'
                            }
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() => {
                              void copy(trimmedEthereum, 'evm');
                            }}
                            style={({ pressed }) => [
                              styles.copyButton,
                              pressed && styles.copyButtonPressed,
                            ]}
                          >
                            <Ionicons
                              name={
                                isCopied('evm') ? 'checkmark' : 'copy-outline'
                              }
                              size={18}
                              color={isCopied('evm') ? '#15803d' : '#5a7d6a'}
                            />
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                    {!trimmedAccountNumber && (needsSolanaRecipient || trimmedSolana) ? (
                      <View style={styles.toAddressRow}>
                        <Text style={styles.toChainLabel}>Solana</Text>
                        <Text style={styles.toAddress} selectable>
                          {trimmedSolana
                            ? formatWalletAddress(trimmedSolana)
                            : '—'}
                        </Text>
                        {trimmedSolana ? (
                          <Pressable
                            accessibilityLabel={
                              isCopied('solana')
                                ? 'Solana address copied'
                                : 'Copy Solana address'
                            }
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() => {
                              void copy(trimmedSolana, 'solana');
                            }}
                            style={({ pressed }) => [
                              styles.copyButton,
                              pressed && styles.copyButtonPressed,
                            ]}
                          >
                            <Ionicons
                              name={
                                isCopied('solana') ? 'checkmark' : 'copy-outline'
                              }
                              size={18}
                              color={isCopied('solana') ? '#15803d' : '#5a7d6a'}
                            />
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}
            {trimmedAccountNumber ||
              needsEthereumRecipient ||
              needsSolanaRecipient ||
              trimmedEthereum ||
              trimmedSolana ? (
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

            {taxLabel ? (
              <TaxDetailsCollapsible
                showEvm={taxFundingChain === 'ethereum'}
                showSolana={taxFundingChain === 'solana'}
                taxLabel={taxLabel}
              />
            ) : null}

            <Text style={styles.heroUsd}>{totalLabel}</Text>

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
                  <ActivityIndicator color="#f0fdf4" />
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
        tokens={spendableTokens}
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
    color: '#166534',
    letterSpacing: -0.6,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  availableUsd: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '600',
    color: '#b91c1c',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
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
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tipPercentButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86d4a4',
    backgroundColor: '#fff',
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
    color: '#166534',
  },
  tipFieldRow: {
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
  tipPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginRight: 4,
  },
  tipInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: '#166534',
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
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recipientValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recipientValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  recipientAdvancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  recipientAdvancedToggleText: {
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
  decodedValueRow: {
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
    paddingVertical: 12,
    paddingRight: 8,
    fontSize: 14,
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  decodedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginVertical: 10,
  },
  toLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toChainLabel: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '600',
    color: '#86a894',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toAddress: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '500',
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  toAddressRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
  },
  copyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonPressed: {
    opacity: 0.65,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
  },
  error: {
    marginTop: 16,
    fontSize: 24,
    lineHeight: 32,
    color: '#b91c1c',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#86d4a4',
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
    color: '#166534',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#166534',
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
    color: '#f0fdf4',
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
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3f6b52',
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
    borderColor: '#86d4a4',
    backgroundColor: '#fff',
  },
  modalSecondaryButtonPressed: {
    opacity: 0.85,
  },
  modalSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  modalPrimaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#166534',
  },
  modalPrimaryButtonPressed: {
    opacity: 0.85,
  },
  modalPrimaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f0fdf4',
  },
});
