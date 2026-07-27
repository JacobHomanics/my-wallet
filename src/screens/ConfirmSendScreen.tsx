import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
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
import { TokenIcon } from '@/components/TokenIcon';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendStatus } from '@/hooks/useSendStatus';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import {
  estimateTokenAmountUsd,
  formatUsdValue,
  parseTokenAmountToRaw,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isValidRecipientAddress } from '@/lib/validation';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Review + execute a transfer prepared on the Send screen.
 */
export function ConfirmSendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'confirmSend'>>();
  const { tokenId, recipient, amount } = route.params;
  const { tokens, loading, ready, refresh } = useTokenBalances();
  const { send, sending } = useSendTransaction();
  const { error, clearStatus, setError } = useSendStatus();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const token = useMemo(
    () => tokens.find((item) => item.id === tokenId) ?? null,
    [tokenId, tokens],
  );

  const amountRaw = useMemo(() => {
    if (!token) {
      return null;
    }
    return parseTokenAmountToRaw(amount, token.decimals);
  }, [amount, token]);

  const usdLabel = useMemo(() => {
    if (!token || amountRaw == null) {
      return null;
    }
    return formatUsdValue(estimateTokenAmountUsd(token, amountRaw));
  }, [amountRaw, token]);

  const chain = token ? getNetworkChain(token.network) : null;
  const recipientValid = chain
    ? isValidRecipientAddress(recipient, chain)
    : false;
  const amountValid =
    amountRaw != null && amountRaw > 0n && token != null
      ? amountRaw <= token.rawBalance
      : false;
  const canSend = Boolean(token) && recipientValid && amountValid;

  const invalidReason = !token
    ? 'Token not found. Go back and select a token again.'
    : !recipientValid
      ? 'Recipient address is invalid.'
      : amountRaw == null || amountRaw <= 0n
        ? 'Amount is invalid.'
        : !amountValid
          ? 'Amount exceeds balance.'
          : null;

  const trimmedRecipient = recipient.trim();

  const onConfirm = useCallback(() => {
    if (!canSend || !token || amountRaw == null || sending) {
      return;
    }

    clearStatus();

    void (async () => {
      try {
        const result = await send({
          token,
          recipient: trimmedRecipient,
          amountRaw,
        });
        refresh();
        navigation.navigate('sent', {
          hash: result.hash,
          amount,
          symbol: token.symbol,
          usdLabel,
          network: token.network,
          networkLabel: token.networkLabel,
          tokenName: token.name,
          logoUrl: token.logoUrl,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Transaction failed';
        setError(message);
      }
    })();
  }, [
    amount,
    amountRaw,
    canSend,
    clearStatus,
    navigation,
    refresh,
    send,
    sending,
    setError,
    token,
    trimmedRecipient,
    usdLabel,
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
    navigation.navigate('send', { tokenId });
  }, [navigation, tokenId]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
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
          <Text style={styles.topBarTitle}>Confirm</Text>
          <View style={styles.topBarSpacer} />
        </View>

        {!ready || (loading && tokens.length === 0) ? (
          <ActivityIndicator color="#0f172a" style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.body} style={styles.flex}>
            <Text style={styles.heroUsd}>
              {usdLabel ?? `${amount} ${token?.symbol ?? ''}`.trim()}
            </Text>

            <Text style={styles.toLabel}>To</Text>
            <Text style={styles.toAddress} selectable>
              {trimmedRecipient}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showAdvanced }}
              onPress={() => {
                setShowAdvanced((open) => !open);
              }}
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
                {token ? (
                  <View style={styles.tokenRow}>
                    <TokenIcon
                      logoUrl={token.logoUrl}
                      network={token.network}
                      size={36}
                      symbol={token.symbol}
                    />
                    <View style={styles.tokenText}>
                      <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                      <Text style={styles.tokenMeta}>{token.name}</Text>
                    </View>
                  </View>
                ) : null}

                <SummaryRow
                  label="Amount"
                  value={`${amount} ${token?.symbol ?? ''}`.trim()}
                />
                <View style={styles.divider} />
                <SummaryRow
                  label="Network"
                  value={token?.networkLabel ?? '—'}
                />
                <View style={styles.divider} />
                <SummaryRow label="Recipient" value={trimmedRecipient} mono />
              </View>
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

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[styles.summaryValue, mono && styles.summaryMono]}
        numberOfLines={mono ? 4 : 2}
        selectable
      >
        {value}
      </Text>
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
  toLabel: {
    marginTop: 36,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    alignSelf: 'stretch',
  },
  toAddress: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    alignSelf: 'stretch',
    fontVariant: ['tabular-nums'],
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
    paddingVertical: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  tokenText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  tokenMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  summaryRow: {
    paddingVertical: 14,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryMono: {
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
  error: {
    marginTop: 16,
    fontSize: 14,
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
