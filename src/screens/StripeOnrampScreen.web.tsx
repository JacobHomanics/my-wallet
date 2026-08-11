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
import { usePopToHome } from '@/hooks/usePopToHome';
import { useTokenBalances } from '@/hooks/useTokenBalances';

/**
 * Web: Stripe embedded Crypto Onramp → ETH / USDC into the Privy EVM wallet.
 */
export function StripeOnrampScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const { refresh } = useTokenBalances();
  const { isCreating, error, createSession, isAvailable } =
    useCreateStripeOnrampSession();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
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
  }, [createSession]);

  const onSessionChange = useCallback(
    ({ session }: { session: OnrampSessionResult }) => {
      if (session.status === 'fulfillment_complete') {
        void refresh();
      }
    },
    [refresh],
  );

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
              EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and ensure an Ethereum wallet
              exists.
            </Text>
          ) : null}

          {isCreating || (!clientSecret && !error) ? (
            <ActivityIndicator color="#166534" style={styles.loader} />
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {clientSecret ? (
            <CryptoElements>
              <OnrampElement
                appearance={{ theme: 'light' }}
                clientSecret={clientSecret}
                onChange={onSessionChange}
              />
            </CryptoElements>
          ) : null}
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loader: {
    marginTop: 48,
  },
  errorText: {
    marginTop: 24,
    fontSize: 15,
    lineHeight: 22,
    color: '#b91c1c',
    textAlign: 'center',
  },
});
