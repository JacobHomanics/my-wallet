import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useVerifyLoginCode } from '@/hooks/useVerifyLoginCode';
import type { RootStackParamList } from '@/navigation/types';

export function LoginVerifyScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const route = useRoute<RouteProp<RootStackParamList, 'loginVerify'>>();
  const { verify } = useVerifyLoginCode();
  const [code, setCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { method, value } = route.params;
  const isValid = code.trim().length >= 4;

  const handleVerify = async () => {
    if (!isValid || isPending) {
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
        // New users land on onboarding; RootNavigator sends completed users to main.
        navigation.reset({
          index: 0,
          routes: [{ name: 'onboarding' }],
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Invalid code. Please try again.');
    } finally {
      setIsPending(false);
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
        <Text style={styles.subtitle}>
          We sent a code to {value}.
        </Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="one-time-code"
          keyboardType="number-pad"
          placeholder="123456"
          placeholderTextColor="#86a894"
          style={styles.input}
          value={code}
          onChangeText={setCode}
          editable={!isPending}
          maxLength={8}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!isValid || isPending}
          onPress={() => {
            void handleVerify();
          }}
          style={({ pressed }) => [
            styles.button,
            (!isValid || isPending) && styles.buttonDisabled,
            pressed && isValid && !isPending && styles.buttonPressed,
          ]}
        >
          {isPending ? (
            <ActivityIndicator color="#f0fdf4" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
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
  input: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#166534',
    backgroundColor: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    minWidth: 160,
    alignItems: 'center',
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
});
