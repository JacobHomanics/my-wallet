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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { SendAdvancedDetails } from '@/components/SendAdvancedDetails';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { useOpenFreshSend } from '@/hooks/useOpenFreshSend';
import { usePopToSend } from '@/hooks/usePopToSend';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { resetSendDraft, useSendDraftUi } from '@/hooks/useSendDraft';
import { useSendForm } from '@/hooks/useSendForm';
import { useSendPayment } from '@/hooks/useSendPayment';
import { useSendStatus } from '@/hooks/useSendStatus';
import { useSendStrategyPicker } from '@/hooks/useStrategyPicker';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useSpendableTokens } from '@/hooks/useSpendableTokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getNetworkChain } from '@/lib/alchemy/networks';
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
  const { spendableTokens } = useSpendableTokens(tokens);
  const { sendPayment, sending } = useSendPayment();
  const { error, clearStatus, setError } = useSendStatus();
  const { copy, isCopied } = useCopyToClipboard();
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
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const popToSend = usePopToSend();
  const openFreshSend = useOpenFreshSend();
  const {
    formatFromUsd,
    formatAmountInputFromUsd,
    parseDisplayInputToUsd,
    currencySymbol,
  } = useFiatDisplay();

  const form = useSendForm(
    spendableTokens,
    selectedStrategyId,
    undefined,
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
    recipientsValid,
    insufficientFunds,
    filledUsd,
    canContinue,
    setAllocationAmount,
    removeAllocation,
    addAllocation,
  } = form;

  const trimmedEthereum = ethereumRecipient.trim();
  const trimmedSolana = solanaRecipient.trim();

  const requiredUsd = parseDisplayInputToUsd(amount);
  const requiredLabel =
    requiredUsd != null
      ? formatFromUsd(requiredUsd)
      : `${currencySymbol}${amount || '0'}`;
  const availableLabel =
    insufficientFunds ? formatFromUsd(filledUsd) : null;

  const canSend = canContinue && allocations.length > 0;

  const invalidReason =
    allocations.length === 0
      ? 'Nothing to send. Go back and enter an amount.'
      : !recipientsValid
        ? 'Recipient address is invalid.'
        : insufficientFunds
          ? 'Insufficient funds for this payment.'
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
        const results = await sendPayment(
          allocations.map((leg) => {
            const chain = getNetworkChain(leg.token.network);
            return {
              token: leg.token,
              recipient:
                chain === 'solana' ? trimmedSolana : trimmedEthereum,
              amountRaw: leg.amountRaw,
              amountFormatted: leg.amountFormatted,
            };
          }),
        );
        resetSendDraft();
        refresh();
        navigation.navigate('sent', {
          usdLabel:
            requiredLabel ??
            `${currencySymbol}${formatAmountInputFromUsd(
              parseDisplayInputToUsd(amount) ?? 0,
            )}`,
          legs: results.map((result) => ({
            hash: result.hash,
            amount: result.amount,
            symbol: result.symbol,
            network: result.network,
            networkLabel: result.networkLabel,
            tokenName: result.tokenName,
            logoUrl: result.logoUrl,
          })),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Transaction failed';
        setError(message);
      }
    })();
  }, [
    allocations,
    amount,
    canSend,
    clearStatus,
    currencySymbol,
    formatAmountInputFromUsd,
    navigation,
    parseDisplayInputToUsd,
    refresh,
    requiredLabel,
    sendPayment,
    sending,
    setError,
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
          <ActivityIndicator color="#0f172a" style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.body} style={styles.flex}>
            <Text style={styles.heroUsd}>{requiredLabel}</Text>
            {availableLabel ? (
              <Text style={styles.availableUsd}>({availableLabel})</Text>
            ) : null}

            {needsEthereumRecipient ||
              needsSolanaRecipient ||
              trimmedEthereum ||
              trimmedSolana ? (
              <View style={styles.toSection}>
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
                          color={isCopied('evm') ? '#15803d' : '#64748b'}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                {needsSolanaRecipient || trimmedSolana ? (
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
                          color={isCopied('solana') ? '#15803d' : '#64748b'}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

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
                  <ActivityIndicator color="#f8fafc" />
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
    backgroundColor: '#f8fafc',
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
  body: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 28,
    alignItems: 'center',
  },
  heroUsd: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.6,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  availableUsd: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '600',
    color: '#15803d',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  toSection: {
    marginTop: 36,
    alignSelf: 'stretch',
  },
  toLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toChainLabel: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toAddress: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
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
    marginTop: 28,
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
    color: '#64748b',
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
    borderColor: '#cbd5e1',
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
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#0f172a',
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
    color: '#0f172a',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
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
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  modalSecondaryButtonPressed: {
    opacity: 0.85,
  },
  modalSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalPrimaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  modalPrimaryButtonPressed: {
    opacity: 0.85,
  },
  modalPrimaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
});
