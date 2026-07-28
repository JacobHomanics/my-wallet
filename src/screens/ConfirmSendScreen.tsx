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
import { useSendPayment } from '@/hooks/useSendPayment';
import { useSendStatus } from '@/hooks/useSendStatus';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import {
  estimateTokenAmountUsd,
  formatUsdAmountInput,
  formatUsdValue,
  parseTokenAmountToRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isValidRecipientAddress } from '@/lib/validation';
import type { HomeStackParamList } from '@/navigation/types';

type ResolvedLeg = {
  token: OwnedToken;
  amount: string;
  amountRaw: bigint;
  usd: number | null;
};

/**
 * Review + execute a multi-token payment prepared on the Send screen.
 */
export function ConfirmSendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'confirmSend'>>();
  const {
    usdAmount,
    ethereumRecipient,
    solanaRecipient,
    legs: legParams,
  } = route.params;
  const { tokens, loading, ready, refresh } = useTokenBalances();
  const { sendPayment, sending } = useSendPayment();
  const { error, clearStatus, setError } = useSendStatus();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const legs = useMemo((): ResolvedLeg[] => {
    const resolved: ResolvedLeg[] = [];
    for (const leg of legParams ?? []) {
      const token = tokens.find((item) => item.id === leg.tokenId);
      if (!token) {
        continue;
      }
      const amountRaw = parseTokenAmountToRaw(leg.amount, token.decimals);
      if (amountRaw == null || amountRaw <= 0n) {
        continue;
      }
      resolved.push({
        token,
        amount: leg.amount,
        amountRaw,
        usd: estimateTokenAmountUsd(token, amountRaw),
      });
    }
    return resolved;
  }, [legParams, tokens]);

  const usdLabel = useMemo(() => {
    const fromLegs = legs.reduce<number | null>((sum, leg) => {
      if (leg.usd == null) {
        return sum;
      }
      return (sum ?? 0) + leg.usd;
    }, null);
    if (fromLegs != null) {
      return formatUsdValue(fromLegs);
    }
    const parsed = Number(usdAmount);
    return Number.isFinite(parsed) ? formatUsdValue(parsed) : `$${usdAmount}`;
  }, [legs, usdAmount]);

  const needsEthereum = legs.some(
    (leg) => getNetworkChain(leg.token.network) === 'ethereum',
  );
  const needsSolana = legs.some(
    (leg) => getNetworkChain(leg.token.network) === 'solana',
  );
  const trimmedEthereum = ethereumRecipient?.trim() ?? '';
  const trimmedSolana = solanaRecipient?.trim() ?? '';
  const ethereumRecipientValid = needsEthereum
    ? isValidRecipientAddress(trimmedEthereum, 'ethereum')
    : true;
  const solanaRecipientValid = needsSolana
    ? isValidRecipientAddress(trimmedSolana, 'solana')
    : true;
  const recipientsValid = ethereumRecipientValid && solanaRecipientValid;

  const amountsValid =
    legs.length > 0 &&
    legs.every(
      (leg) => leg.amountRaw > 0n && leg.amountRaw <= leg.token.rawBalance,
    );

  const canSend =
    legs.length > 0 &&
    legs.length === (legParams?.length ?? 0) &&
    recipientsValid &&
    amountsValid;

  const invalidReason =
    (legParams?.length ?? 0) === 0
      ? 'Nothing to send. Go back and enter an amount.'
      : legs.length !== (legParams?.length ?? 0)
        ? 'One or more tokens are unavailable. Go back and try again.'
        : !recipientsValid
          ? 'Recipient address is invalid.'
          : !amountsValid
            ? 'Insufficient funds for this payment.'
            : null;

  const onConfirm = useCallback(() => {
    if (!canSend || sending) {
      return;
    }

    clearStatus();

    void (async () => {
      try {
        const results = await sendPayment(
          legs.map((leg) => {
            const chain = getNetworkChain(leg.token.network);
            return {
              token: leg.token,
              recipient:
                chain === 'solana' ? trimmedSolana : trimmedEthereum,
              amountRaw: leg.amountRaw,
              amountFormatted: leg.amount,
            };
          }),
        );
        refresh();
        navigation.navigate('sent', {
          usdLabel:
            usdLabel ?? `$${formatUsdAmountInput(Number(usdAmount) || 0)}`,
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
    canSend,
    clearStatus,
    legs,
    navigation,
    refresh,
    sendPayment,
    sending,
    setError,
    trimmedEthereum,
    trimmedSolana,
    usdAmount,
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
    navigation.navigate('send');
  }, [navigation]);

  const goToSend = useCallback(() => {
    navigation.navigate('send');
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
            <Text style={styles.heroUsd}>{usdLabel ?? `$${usdAmount}`}</Text>

            <View style={styles.toSection}>
              <Text style={styles.toLabel}>To</Text>
              {needsEthereum ? (
                <>
                  {needsSolana ? (
                    <Text style={styles.toChainLabel}>EVM</Text>
                  ) : null}
                  <Text style={styles.toAddress} selectable>
                    {trimmedEthereum}
                  </Text>
                </>
              ) : null}
              {needsSolana ? (
                <>
                  {needsEthereum ? (
                    <Text style={styles.toChainLabel}>Solana</Text>
                  ) : null}
                  <Text style={styles.toAddress} selectable>
                    {trimmedSolana}
                  </Text>
                </>
              ) : null}
            </View>

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
                {legs.map((leg, index) => (
                  <View key={leg.token.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.tokenRow}>
                      <TokenIcon
                        logoUrl={leg.token.logoUrl}
                        network={leg.token.network}
                        size={36}
                        symbol={leg.token.symbol}
                      />
                      <View style={styles.tokenText}>
                        <Text style={styles.tokenSymbol}>
                          {leg.amount} {leg.token.symbol}
                        </Text>
                        <Text style={styles.tokenMeta}>
                          {leg.token.networkLabel}
                          {leg.usd != null
                            ? ` · ${formatUsdValue(leg.usd)}`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
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
    marginTop: 16,
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toAddress: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
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
