import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { CodeDigitInputs } from '@/components/CodeDigitInputs';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useResendLoginCode } from '@/hooks/useResendLoginCode';
import { useVerifyLoginCode } from '@/hooks/useVerifyLoginCode';
import type { RootStackParamList } from '@/navigation/types';

export function LoginVerifyScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const route = useRoute<RouteProp<RootStackParamList, 'loginVerify'>>();
  const { verify } = useVerifyLoginCode();
  const { resend, cooldown, canResend, isPending: isResendPending } =
    useResendLoginCode();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [codeInputResetSignal, setCodeInputResetSignal] = useState(0);

  const { method, value } = route.params;

  const handleVerify = useCallback(
    async (code: string) => {
      if (isPending) {
        return;
      }

      setErrorMessage(null);
      setIsPending(true);
      Keyboard.dismiss();

      try {
        await verify(method, value, code);
        // Wallet creation runs in EnsureEmbeddedWallets after auth settles
        // (avoids racing a second create call from this screen).
        if (
          route.params.returnTo === 'exportWallet' &&
          route.params.address &&
          route.params.chain
        ) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'exportWallet',
                params: {
                  address: route.params.address,
                  chain: route.params.chain,
                },
              },
            ],
          });
        } else {
          // RootNavigator redirects to onboarding when still needed.
          navigation.reset({
            index: 0,
            routes: [{ name: 'main' }],
          });
        }
      } catch (error) {
        console.error(error);
        setCodeInputResetSignal((current) => current + 1);
        setErrorMessage('Invalid code. Please try again.');
      } finally {
        setIsPending(false);
      }
    },
    [isPending, method, navigation, route.params, value, verify],
  );

  const handleResend = async () => {
    if (!canResend) {
      return;
    }

    setErrorMessage(null);

    try {
      await resend(method, value);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        method === 'email'
          ? 'Could not resend an email code. Please try again.'
          : 'Could not resend an SMS code. Please try again.',
      );
    }
  };

  return (
    <View style={styles.container}>
      {!isDesktopWeb ? (
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <BackButton accessibilityLabel="Back to login" />
        </View>
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title}>Enter code</Text>
        <Text style={styles.subtitle}>We sent a code to {value}.</Text>

        <CodeDigitInputs
          key={codeInputResetSignal}
          editable={!isPending}
          focusOnMount
          onCodeComplete={(code) => {
            void handleVerify(code);
          }}
        />

        {isPending ? (
          <ActivityIndicator color="#166534" style={styles.spinner} />
        ) : null}

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canResend || isPending}
          onPress={() => {
            void handleResend();
          }}
          style={({ pressed }) => [
            styles.resendButton,
            pressed && canResend && !isPending && styles.resendButtonPressed,
          ]}
        >
          {isResendPending ? (
            <ActivityIndicator color="#5a7d6a" />
          ) : (
            <Text
              style={[
                styles.resendText,
                (cooldown > 0 || isPending) && styles.resendTextDisabled,
              ]}
            >
              {cooldown > 0
                ? `Resend verification code in ${cooldown} seconds...`
                : 'Resend code'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 12,
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
    color: '#3f6b52',
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonPressed: {
    opacity: 0.8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
    textAlign: 'center',
  },
  resendTextDisabled: {
    color: '#5a7d6a',
    opacity: 0.7,
  },
});
