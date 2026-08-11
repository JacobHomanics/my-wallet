import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { usePrivyFiatOnramp } from '@/hooks/usePrivyFiatOnramp';
import { useTokenBalances } from '@/hooks/useTokenBalances';

/**
 * Privy prebuilt fiat onramp (Stripe Embedded Components among providers).
 * @see https://docs.privy.io/wallets/funding/fiat-onramp
 */
export function StripeOnrampComponentsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const { refresh } = useTokenBalances();
  const { isAvailable, isFunding, status, error, startFund } =
    usePrivyFiatOnramp();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !isAvailable) {
      return;
    }
    startedRef.current = true;
    void (async () => {
      const result = await startFund();
      if (result === 'confirmed' || result === 'submitted') {
        void refresh();
      }
    })();
  }, [isAvailable, refresh, startFund]);

  const onRetry = () => {
    startedRef.current = true;
    void (async () => {
      const result = await startFund();
      if (result === 'confirmed' || result === 'submitted') {
        void refresh();
      }
    })();
  };

  const showSuccess = status === 'confirmed' || status === 'submitted';
  const successMessage =
    status === 'confirmed'
      ? 'Deposit confirmed. Funds should appear in your wallet shortly.'
      : 'Deposit submitted. Final confirmation may take a moment.';

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.shell}>
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
          <Text style={styles.topBarTitle}>Deposit</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View
          style={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
        >
          {!isAvailable ? (
            <Text style={styles.errorText}>
              No Ethereum wallet available to deposit into.
            </Text>
          ) : null}

          {isFunding ? (
            <View accessibilityRole="progressbar" style={styles.loadingPanel}>
              <ActivityIndicator color="#166534" size="large" />
              <Text style={styles.loadingText}>Opening deposit…</Text>
            </View>
          ) : null}

          {!isFunding && error ? (
            <View style={styles.messageBlock}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityLabel="Try again"
                accessibilityRole="button"
                onPress={onRetry}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {!isFunding && showSuccess ? (
            <View style={styles.messageBlock}>
              <Text style={styles.successText}>{successMessage}</Text>
              <Pressable
                accessibilityLabel="Done"
                accessibilityRole="button"
                onPress={goHome}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          ) : null}

          {!isFunding && !error && !showSuccess && isAvailable ? (
            <View style={styles.messageBlock}>
              <Text style={styles.hintText}>
                Complete the deposit in the Privy window, or start again if you
                closed it.
              </Text>
              <Pressable
                accessibilityLabel="Start deposit"
                accessibilityRole="button"
                onPress={onRetry}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Start deposit</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  shell: {
    flex: 1,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
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
    color: '#14532d',
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
  webBackText: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '500',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'center',
  },
  loadingPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 240,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5a7d6a',
    textAlign: 'center',
  },
  messageBlock: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 8,
  },
  hintText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5a7d6a',
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#166534',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#b91c1c',
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
});
