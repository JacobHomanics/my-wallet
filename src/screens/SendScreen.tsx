import { useCallback } from 'react';
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
  const {
    strategies,
    selectedStrategy,
    selectedStrategyId,
    pickerOpen: strategyPickerOpen,
    openPicker: openStrategyPicker,
    closePicker: closeStrategyPicker,
    onSelectStrategy,
  } = useStrategyPicker();

  const form = useSendForm(
    tokens,
    selectedStrategyId,
    route.params?.tokenId,
  );
  const {
    amount,
    allocations,
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

  const topBar = (
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
        <BackButton accessibilityLabel="Back to home" onPress={goHome} />
      )}
      <Text style={styles.topBarTitle}>Send</Text>
      <View style={styles.topBarSpacer} />
    </View>
  );

  const formBody =
    !ready || (loading && tokens.length === 0) ? (
      <ActivityIndicator color="#0f172a" style={styles.loader} />
    ) : !hasWallet ? (
      <Text style={styles.empty}>Creating your wallets…</Text>
    ) : (
      <>
        <Text
          accessibilityLabel={`Balance ${totalLabel}`}
          style={styles.totalBalance}
        >
          {totalLabel}
        </Text>

        <View style={styles.amountHeader}>
          <Text style={styles.labelInline}>Amount</Text>
        </View>
        <View
          style={[styles.amountRow, amountError ? styles.inputError : null]}
        >
          <Text style={styles.amountPrefix}>$</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="#94a3b8"
            style={styles.amountInput}
            value={amount}
          />
        </View>
        {amountError ? (
          <Text style={styles.fieldError}>{amountError}</Text>
        ) : null}

        {!needsEthereumRecipient && !needsSolanaRecipient ? (
          <>
            <Text style={styles.label}>To</Text>
            <View style={[styles.recipientRow, styles.inputDisabled]}>
              <Text style={styles.recipientPlaceholder}>
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
                    styles.recipientRow,
                    ethereumRecipientError ? styles.inputError : null,
                  ]}
                >
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setEthereumRecipient}
                    placeholder="0x… Ethereum address"
                    placeholderTextColor="#94a3b8"
                    style={styles.recipientInput}
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
                      style={({ pressed }) => [
                        styles.clearButton,
                        pressed && styles.clearButtonPressed,
                      ]}
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
                    styles.recipientRow,
                    solanaRecipientError ? styles.inputError : null,
                  ]}
                >
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setSolanaRecipient}
                    placeholder="Solana address"
                    placeholderTextColor="#94a3b8"
                    style={styles.recipientInput}
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
                      style={({ pressed }) => [
                        styles.clearButton,
                        pressed && styles.clearButtonPressed,
                      ]}
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
                  <Text style={styles.fieldError}>{solanaRecipientError}</Text>
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
            {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
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

            <Text style={styles.advancedLabel}>Tokens</Text>
            {allocations.length === 0 ? (
              <Text style={styles.allocationEmpty}>
                Enter an amount to see which tokens will be used.
              </Text>
            ) : (
              allocations.map((leg) => (
                <View key={leg.token.id} style={styles.allocationRow}>
                  <TokenIcon
                    logoUrl={leg.token.logoUrl}
                    network={leg.token.network}
                    size={36}
                    symbol={leg.token.symbol}
                  />
                  <View style={styles.allocationText}>
                    <Text style={styles.allocationSymbol}>
                      {leg.token.symbol}
                    </Text>
                    <Text style={styles.allocationMeta}>
                      {leg.amountFormatted} · {leg.token.networkLabel}
                    </Text>
                  </View>
                  <Text style={styles.allocationUsd}>
                    {formatUsdValue(leg.usd) ?? '—'}
                  </Text>
                </View>
              ))
            )}
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
      </>
    );

  const scroll = (
    <ScrollView
      bounces
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 12) + 48 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      style={[
        styles.scroll,
        Platform.OS === 'web'
          ? ({
              height: '100%',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            } as object)
          : null,
      ]}
    >
      {topBar}
      <View style={styles.contentInner}>{formBody}</View>
    </ScrollView>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 12) },
      ]}
    >
      {Platform.OS === 'web' ? (
        scroll
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {scroll}
        </KeyboardAvoidingView>
      )}

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
    height: '100%',
    maxHeight: '100%',
    backgroundColor: '#f8fafc',
    ...Platform.select({
      web: {
        // Bound the screen to the viewport so the inner ScrollView can scroll
        // on iOS Safari (unbounded flex parents clip with no scroll).
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      default: {},
    }),
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentInner: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
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
    flexGrow: 1,
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
  allocationEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    paddingVertical: 8,
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  allocationText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  allocationSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  allocationMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  allocationUsd: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
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
  recipientPlaceholder: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#94a3b8',
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
    marginTop: 8,
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
  amountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 4,
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
});
