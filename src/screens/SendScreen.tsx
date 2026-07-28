import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { TokenChainSection } from '@/components/TokenChainSection';
import { TokenIcon } from '@/components/TokenIcon';
import { useExpandedNetworks } from '@/hooks/useExpandedNetworks';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendForm } from '@/hooks/useSendForm';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useStrategyPicker } from '@/hooks/useStrategyPicker';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useTokensByChain } from '@/hooks/useTokensByChain';
import {
  formatUsdValue,
  type TokenChainGroup,
} from '@/lib/alchemy/fetchTokensByAddress';
import type { HomeStackParamList } from '@/navigation/types';

export function SendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'send'>>();
  const { tokens, totalUsd, loading, ready, ethereumAddress, solanaAddress } =
    useTokenBalances();
  const chainGroups = useTokensByChain(tokens);
  const { expandedNetworks, isExpanded, toggleNetwork } = useExpandedNetworks();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const {
    strategies,
    selectedStrategy,
    selectedStrategyId,
    pickerOpen: strategyPickerOpen,
    openPicker: openStrategyPicker,
    closePicker: closeStrategyPicker,
    onSelectStrategy,
  } = useStrategyPicker();
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useSendForm(tokens, route.params?.tokenId);
  const {
    selectedToken,
    recipient,
    amount,
    tokenAmount,
    amountIsUsd,
    chain,
    recipientValid,
    exceedsBalance,
    tokenAmountHint,
    canContinue,
    setSelectedTokenId,
    setRecipient,
    setAmount,
  } = form;

  const totalLabel = formatUsdValue(totalUsd) ?? '$0.00';
  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const recipientHint =
    chain === 'solana'
      ? 'Solana address'
      : chain === 'ethereum'
        ? '0x… Ethereum address'
        : 'Select a token first';

  const amountError =
    amount.trim() && exceedsBalance
      ? 'Amount exceeds balance'
      : amount.trim() && !form.amountValid
        ? 'Enter a valid amount'
        : null;

  const recipientError =
    recipient.trim() && !recipientValid && chain
      ? chain === 'solana'
        ? 'Enter a valid Solana address'
        : 'Enter a valid Ethereum address'
      : null;

  const onSelectToken = useCallback(
    (tokenId: string) => {
      setSelectedTokenId(tokenId);
      setPickerOpen(false);
    },
    [setSelectedTokenId],
  );

  const renderChainSection = useCallback(
    ({ item }: { item: TokenChainGroup }) => (
      <TokenChainSection
        group={item}
        expanded={isExpanded(item.network)}
        expandedNetworks={expandedNetworks}
        onToggle={() => {
          toggleNetwork(item.network);
        }}
        onToggleNetwork={toggleNetwork}
        onTokenPress={onSelectToken}
        selectedTokenId={selectedToken?.id}
        showNetworkMeta
      />
    ),
    [
      expandedNetworks,
      isExpanded,
      onSelectToken,
      selectedToken?.id,
      toggleNetwork,
    ],
  );

  const onContinue = useCallback(() => {
    if (!canContinue || !selectedToken || !tokenAmount) {
      return;
    }

    navigation.navigate('confirmSend', {
      tokenId: selectedToken.id,
      recipient: recipient.trim(),
      amount: tokenAmount,
    });
  }, [canContinue, navigation, recipient, selectedToken, tokenAmount]);

  const goHome = useCallback(() => {
    navigation.navigate('index');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
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
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
              style={styles.flex}
            >
              <Text
                accessibilityLabel={`Balance ${totalLabel}`}
                style={styles.totalBalance}
              >
                {totalLabel}
              </Text>

              <Text style={styles.label}>To</Text>
              <View
                style={[
                  styles.recipientRow,
                  !selectedToken && styles.inputDisabled,
                  recipientError ? styles.inputError : null,
                ]}
              >
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={Boolean(selectedToken)}
                  onChangeText={setRecipient}
                  placeholder={recipientHint}
                  placeholderTextColor="#94a3b8"
                  style={styles.recipientInput}
                  value={recipient}
                />
                {recipient.trim() && selectedToken ? (
                  <Pressable
                    accessibilityLabel="Clear recipient"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      setRecipient('');
                    }}
                    style={({ pressed }) => [
                      styles.clearButton,
                      pressed && styles.clearButtonPressed,
                    ]}
                  >
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </Pressable>
                ) : null}
              </View>
              {recipientError ? (
                <Text style={styles.fieldError}>{recipientError}</Text>
              ) : null}

              <View style={styles.amountHeader}>
                <Text style={styles.labelInline}>Amount</Text>
              </View>
              <View
                style={[
                  styles.amountRow,
                  !selectedToken && styles.inputDisabled,
                  amountError ? styles.inputError : null,
                ]}
              >
                {amountIsUsd ? (
                  <Text style={styles.amountPrefix}>$</Text>
                ) : null}
                <TextInput
                  editable={Boolean(selectedToken)}
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  style={styles.amountInput}
                  value={amount}
                />
                {!amountIsUsd && selectedToken ? (
                  <Text style={styles.amountSymbol}>
                    {selectedToken.symbol}
                  </Text>
                ) : null}
              </View>
              {amountError ? (
                <Text style={styles.fieldError}>{amountError}</Text>
              ) : tokenAmountHint ? (
                <Text style={styles.tokenAmountHint}>{tokenAmountHint}</Text>
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
                    <Text style={styles.strategyRowValue}>
                      {selectedStrategy.label}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                  </Pressable>

                  <View style={styles.advancedDivider} />

                  <Text style={styles.advancedLabel}>Token</Text>
                  <Pressable
                    accessibilityLabel={
                      selectedToken
                        ? `Selected token ${selectedToken.symbol}`
                        : 'Select a token'
                    }
                    accessibilityRole="button"
                    onPress={() => {
                      setPickerOpen(true);
                    }}
                    style={({ pressed }) => [
                      styles.fieldButton,
                      pressed && styles.fieldButtonPressed,
                    ]}
                  >
                    {selectedToken ? (
                      <View style={styles.selectedToken}>
                        <TokenIcon
                          logoUrl={selectedToken.logoUrl}
                          network={selectedToken.network}
                          size={36}
                          symbol={selectedToken.symbol}
                        />
                        <View style={styles.selectedTokenText}>
                          <Text style={styles.selectedSymbol}>
                            {selectedToken.symbol}
                          </Text>
                          <Text style={styles.selectedMeta}>
                            {selectedToken.balanceFormatted} ·{' '}
                            {selectedToken.networkLabel}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.placeholder}>Select a token</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                  </Pressable>
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

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setPickerOpen(false);
        }}
        presentationStyle="pageSheet"
        visible={pickerOpen}
      >
        <View
          style={[
            styles.modalContainer,
            { paddingTop: Math.max(insets.top, 12) },
          ]}
        >
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Select token</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setPickerOpen(false);
              }}
              style={({ pressed }) => [
                styles.modalClose,
                pressed && styles.modalClosePressed,
              ]}
            >
              <Ionicons name="close" size={22} color="#0f172a" />
            </Pressable>
          </View>

          <FlatList
            contentContainerStyle={
              chainGroups.length === 0 ? styles.pickerEmpty : styles.pickerList
            }
            data={chainGroups}
            keyExtractor={(item) => item.network}
            ListEmptyComponent={
              <Text style={styles.empty}>No tokens available to send.</Text>
            }
            renderItem={renderChainSection}
          />
        </View>
      </Modal>

      <StrategyPickerModal
        onClose={closeStrategyPicker}
        onSelect={onSelectStrategy}
        selectedStrategyId={selectedStrategyId}
        strategies={strategies}
        visible={strategyPickerOpen}
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
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
  labelInline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  advanced: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  advancedLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  advancedDivider: {
    marginBottom: 4,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  strategyRowPressed: {
    opacity: 0.7,
  },
  strategyRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  strategyRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    minHeight: 64,
  },
  fieldButtonPressed: {
    opacity: 0.85,
  },
  selectedToken: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  selectedTokenText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  selectedSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  selectedMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  placeholder: {
    fontSize: 16,
    color: '#94a3b8',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: '#fff',
  },
  recipientInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonPressed: {
    opacity: 0.6,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
  },
  inputError: {
    borderColor: '#fca5a5',
  },
  amountHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  amountSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  amountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 4,
  },
  tokenAmountHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
    fontVariant: ['tabular-nums'],
  },
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: '#b91c1c',
  },
  continueButton: {
    marginTop: 32,
    alignItems: 'center',
    alignSelf: 'stretch',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    paddingLeft: 40,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePressed: {
    opacity: 0.6,
  },
  pickerList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  pickerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
