import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
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
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
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
  const { status, clearStatus, setSuccess, setError } = useSendStatus();
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    if (
      !canSend ||
      !token ||
      amountRaw == null ||
      sending ||
      status?.kind === 'success'
    ) {
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
        setSuccess({
          hash: result.hash,
          amount,
          symbol: token.symbol,
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
    canSend,
    clearStatus,
    refresh,
    send,
    sending,
    setError,
    setSuccess,
    status?.kind,
    token,
    trimmedRecipient,
  ]);

  const onDone = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

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
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
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
            {status?.kind === 'error' ? (
              <Text style={styles.error}>{status.message}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!canSend || sending}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.primaryButton,
                (!canSend || sending) && styles.primaryButtonDisabled,
                pressed && canSend && !sending && styles.primaryButtonPressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#f8fafc" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit</Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </View>
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
  primaryButton: {
    marginTop: 28,
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
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
});
