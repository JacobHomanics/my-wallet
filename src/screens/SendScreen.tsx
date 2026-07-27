import { memo, useCallback, useEffect, useState } from 'react';
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
import { TokenIcon } from '@/components/TokenIcon';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendForm } from '@/hooks/useSendForm';
import { useSendStatus } from '@/hooks/useSendStatus';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import {
  formatUsdValue,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import type { HomeStackParamList } from '@/navigation/types';

const TokenPickerRow = memo(function TokenPickerRow({
  token,
  selected,
  onSelect,
}: {
  token: OwnedToken;
  selected: boolean;
  onSelect: (tokenId: string) => void;
}) {
  const usdLabel = formatUsdValue(token.usdValue);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        onSelect(token.id);
      }}
      style={({ pressed }) => [
        styles.pickerRow,
        selected && styles.pickerRowSelected,
        pressed && styles.pickerRowPressed,
      ]}
    >
      <View style={styles.pickerLeft}>
        <TokenIcon
          logoUrl={token.logoUrl}
          network={token.network}
          symbol={token.symbol}
        />
        <View style={styles.pickerText}>
          <Text style={styles.pickerSymbol} numberOfLines={1}>
            {token.symbol}
          </Text>
          <Text style={styles.pickerMeta} numberOfLines={1}>
            {token.networkLabel}
          </Text>
        </View>
      </View>
      <View style={styles.pickerRight}>
        <Text style={styles.pickerBalance} numberOfLines={1}>
          {token.balanceFormatted}
        </Text>
        {usdLabel ? (
          <Text style={styles.pickerUsd} numberOfLines={1}>
            {usdLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

export function SendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'send'>>();
  const { tokens, loading, ready, ethereumAddress, solanaAddress, refresh } =
    useTokenBalances();
  const {
    send,
    sending,
  } = useSendTransaction();
  const { status, clearStatus, setSuccess, setError } = useSendStatus();
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useSendForm(tokens, route.params?.tokenId);
  const {
    selectedToken,
    recipient,
    amount,
    amountRaw,
    chain,
    recipientValid,
    exceedsBalance,
    canContinue,
    setSelectedTokenId,
    setRecipient,
    setAmount,
    setMaxAmount,
  } = form;

  useEffect(() => {
    const tokenId = route.params?.tokenId;
    if (!tokenId || selectedToken) {
      return;
    }
    if (tokens.some((token) => token.id === tokenId)) {
      setSelectedTokenId(tokenId);
    }
  }, [route.params?.tokenId, selectedToken, setSelectedTokenId, tokens]);

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
      clearStatus();
      setSelectedTokenId(tokenId);
      setPickerOpen(false);
    },
    [clearStatus, setSelectedTokenId],
  );

  const onRecipientChange = useCallback(
    (value: string) => {
      clearStatus();
      setRecipient(value);
    },
    [clearStatus, setRecipient],
  );

  const onAmountChange = useCallback(
    (value: string) => {
      clearStatus();
      setAmount(value);
    },
    [clearStatus, setAmount],
  );

  const onContinue = useCallback(() => {
    if (!canContinue || !selectedToken || amountRaw == null || sending) {
      return;
    }

    clearStatus();

    void (async () => {
      try {
        const result = await send({
          token: selectedToken,
          recipient: recipient.trim(),
          amountRaw,
        });
        refresh();
        setSuccess({
          hash: result.hash,
          amount,
          symbol: selectedToken.symbol,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Transaction failed';
        setError(message);
      }
    })();
  }, [
    amount,
    amountRaw,
    canContinue,
    clearStatus,
    recipient,
    refresh,
    selectedToken,
    send,
    sending,
    setError,
    setSuccess,
  ]);

  const onDone = useCallback(() => {
    navigation.goBack();
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
                accessibilityLabel="Back"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  navigation.goBack();
                }}
                style={({ pressed }) => [
                  styles.webBack,
                  pressed && styles.webBackPressed,
                ]}
              >
                <Text style={styles.webBackText}>Back</Text>
              </Pressable>
            ) : (
              <BackButton accessibilityLabel="Back" />
            )}
            <Text style={styles.topBarTitle}>Send</Text>
            <View style={styles.topBarSpacer} />
          </View>

          {!ready || (loading && tokens.length === 0) ? (
            <ActivityIndicator color="#0f172a" style={styles.loader} />
          ) : !hasWallet ? (
            <Text style={styles.empty}>Creating your wallets…</Text>
          ) : status?.kind === 'success' ? (
            <View style={styles.result}>
              <View style={styles.resultIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#15803d" />
              </View>
              <Text style={styles.resultTitle}>Sent</Text>
              <Text style={styles.resultAmount}>
                {status.amount} {status.symbol}
              </Text>
              <Text style={styles.resultHash} selectable>
                {formatWalletAddress(status.hash, 10, 10)}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onDone}
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.continueButtonPressed,
                ]}
              >
                <Text style={styles.continueButtonText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
              style={styles.flex}
            >
              <Text style={styles.label}>Token</Text>
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

              <Text style={styles.label}>To</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={Boolean(selectedToken)}
                onChangeText={onRecipientChange}
                placeholder={recipientHint}
                placeholderTextColor="#94a3b8"
                style={[
                  styles.input,
                  !selectedToken && styles.inputDisabled,
                  recipientError ? styles.inputError : null,
                ]}
                value={recipient}
              />
              {recipientError ? (
                <Text style={styles.fieldError}>{recipientError}</Text>
              ) : null}

              <View style={styles.amountHeader}>
                <Text style={styles.labelInline}>Amount</Text>
                {selectedToken ? (
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      clearStatus();
                      setMaxAmount();
                    }}
                    style={({ pressed }) => [
                      styles.maxButton,
                      pressed && styles.maxButtonPressed,
                    ]}
                  >
                    <Text style={styles.maxButtonText}>Max</Text>
                  </Pressable>
                ) : null}
              </View>
              <View
                style={[
                  styles.amountRow,
                  !selectedToken && styles.inputDisabled,
                  amountError ? styles.inputError : null,
                ]}
              >
                <TextInput
                  editable={Boolean(selectedToken)}
                  keyboardType="decimal-pad"
                  onChangeText={onAmountChange}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  style={styles.amountInput}
                  value={amount}
                />
                {selectedToken ? (
                  <Text style={styles.amountSymbol}>
                    {selectedToken.symbol}
                  </Text>
                ) : null}
              </View>
              {amountError ? (
                <Text style={styles.fieldError}>{amountError}</Text>
              ) : selectedToken ? (
                <Text style={styles.balanceHint}>
                  Balance {selectedToken.balanceFormatted}{' '}
                  {selectedToken.symbol}
                </Text>
              ) : null}

              {status?.kind === 'error' ? (
                <Text style={styles.sendError}>{status.message}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={!canContinue || sending}
                onPress={onContinue}
                style={({ pressed }) => [
                  styles.continueButton,
                  (!canContinue || sending) && styles.continueButtonDisabled,
                  pressed &&
                    canContinue &&
                    !sending &&
                    styles.continueButtonPressed,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#f8fafc" />
                ) : (
                  <Text style={styles.continueButtonText}>Send</Text>
                )}
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
              tokens.length === 0 ? styles.pickerEmpty : styles.pickerList
            }
            data={tokens}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>No tokens available to send.</Text>
            }
            renderItem={({ item }) => (
              <TokenPickerRow
                onSelect={onSelectToken}
                selected={item.id === selectedToken?.id}
                token={item}
              />
            )}
          />
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
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
  result: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  resultAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  resultHash: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
    fontVariant: ['tabular-nums'],
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
    backgroundColor: '#fff',
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
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maxButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  maxButtonPressed: {
    opacity: 0.6,
  },
  maxButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
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
  balanceHint: {
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
  sendError: {
    marginTop: 20,
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
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
    gap: 4,
  },
  pickerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pickerRowSelected: {
    backgroundColor: '#e2e8f0',
  },
  pickerRowPressed: {
    opacity: 0.75,
  },
  pickerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  pickerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pickerSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  pickerMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  pickerRight: {
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: '42%',
  },
  pickerBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  pickerUsd: {
    fontSize: 13,
    color: '#64748b',
    fontVariant: ['tabular-nums'],
  },
});
