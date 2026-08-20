import { useCallback, useEffect, useRef, useState } from 'react';
import type { OnrampSessionResult } from '@stripe/crypto';
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
import { CryptoElements } from '@/components/stripe/CryptoElements';
import { OnrampElement } from '@/components/stripe/OnrampElement';
import { useCreateStripeOnrampSession } from '@/hooks/useCreateStripeOnrampSession';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useOnrampVaultDepositCompletion } from '@/hooks/useOnrampVaultDepositCompletion';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useStripeOnrampUiReady } from '@/hooks/useStripeOnrampUiReady';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

function DepositLoading({ message }: { message: string }) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <View accessibilityRole="progressbar" style={styles.loadingPanel}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

/**
 * Web: Stripe embedded Crypto Onramp into the user's Privy EVM wallet.
 * Supports Base / Ethereum and Avalanche destinations.
 */
export function StripeOnrampScreen() {
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const {
    getPriorBaseUsdcBalanceRaw,
    completeOnramp,
    completionMessage,
    isVaultDepositing,
    isComplete,
  } = useOnrampVaultDepositCompletion();
  const { isCreating, error, createSession, isAvailable } =
    useCreateStripeOnrampSession();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [onrampComplete, setOnrampComplete] = useState(false);
  const startedRef = useRef(false);
  const priorBalanceRawRef = useRef<bigint>(0n);
  const completionStartedRef = useRef(false);
  const { uiReady, onReady } = useStripeOnrampUiReady(clientSecret);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    priorBalanceRawRef.current = getPriorBaseUsdcBalanceRaw();
    let cancelled = false;
    void (async () => {
      const session = await createSession();
      if (!cancelled && session) {
        setClientSecret(session.clientSecret);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createSession, getPriorBaseUsdcBalanceRaw]);

  const onSessionChange = useCallback(
    ({ session }: { session: OnrampSessionResult }) => {
      if (session.status !== 'fulfillment_complete' || completionStartedRef.current) {
        return;
      }
      completionStartedRef.current = true;
      setOnrampComplete(true);
      void completeOnramp(priorBalanceRawRef.current);
    },
    [completeOnramp],
  );

  const showSessionLoader =
    isAvailable && !error && (isCreating || !clientSecret);
  const showEmbedLoader = Boolean(clientSecret) && !uiReady;
  const loadingMessage = 'Loading...';
  const showCompletionOverlay = onrampComplete && isComplete;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to home"
              accessibilityRole="button"
              disabled={isVaultDepositing}
              hitSlop={8}
              onPress={goHome}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
                isVaultDepositing && styles.webBackDisabled,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to home"
              disabled={isVaultDepositing}
              onPress={goHome}
            />
          )}
          <Text style={styles.topBarTitle}>Deposit</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          style={styles.flex}
        >
          {!isAvailable && !error ? (
            <Text style={styles.errorText}>
              Stripe onramp is not configured. Add
              EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and ensure an EVM wallet
              exists.
            </Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {showSessionLoader ? (
            <DepositLoading message={loadingMessage} />
          ) : null}

          {clientSecret ? (
            <View style={styles.onrampWrap}>
              {showEmbedLoader ? (
                <View style={styles.loadingOverlay}>
                  <DepositLoading message={loadingMessage} />
                </View>
              ) : null}
              {showCompletionOverlay ? (
                <View style={styles.completionOverlay}>
                  <View style={styles.completionCard}>
                    <Text
                      style={
                        completionMessage?.includes('could not') ||
                        completionMessage?.includes('still arriving')
                          ? styles.warningText
                          : styles.successText
                      }
                    >
                      {completionMessage}
                    </Text>
                    <Pressable
                      accessibilityLabel="Done"
                      accessibilityRole="button"
                      onPress={goHome}
                      style={({ pressed }) => [
                        styles.doneButton,
                        pressed && styles.doneButtonPressed,
                      ]}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <View
                style={uiReady ? styles.onrampVisible : styles.onrampHidden}
              >
                <CryptoElements>
                  <OnrampElement
                    appearance={{ theme: 'light' }}
                    clientSecret={clientSecret}
                    onChange={onSessionChange}
                    onReady={onReady}
                  />
                </CryptoElements>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  shell: {
    flex: 1,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: 44,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: c.text,
  },
  topBarSpacer: {
    width: 64,
  },
  webBack: {
    width: 64,
    paddingVertical: 8,
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackDisabled: {
    opacity: 0.45,
  },
  webBackText: {
    fontSize: 16,
    color: c.primary,
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  onrampWrap: {
    position: 'relative',
    minHeight: 640,
    width: '100%',
  },
  onrampVisible: {
    opacity: 1,
  },
  onrampHidden: {
    opacity: 0,
  },
  loadingPanel: {
    minHeight: 640,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: c.bg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  completionOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    backgroundColor: c.bg,
  },
  completionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textMuted,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    lineHeight: 22,
    color: c.primary,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#b45309',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 24,
    fontSize: 15,
    lineHeight: 22,
    color: c.danger,
    textAlign: 'center',
  },
  doneButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: c.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  doneButtonPressed: {
    opacity: 0.85,
  },
  doneButtonText: {
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  });
}
