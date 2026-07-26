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

import { useCreateEmbeddedWallets } from '@/hooks/useCreateEmbeddedWallets';
import { useVerifyLoginCode } from '@/hooks/useVerifyLoginCode';
import type { RootStackParamList } from '@/navigation/types';

export function LoginVerifyScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'loginVerify'>>();
  const { verify } = useVerifyLoginCode();
  const { ensureEmbeddedWallets } = useCreateEmbeddedWallets();
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
      // Whitelabel OTP does not trigger createOnLogin — create wallets here.
      try {
        await ensureEmbeddedWallets();
      } catch (walletError) {
        console.error('Failed to create embedded wallets after login', walletError);
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'main' }],
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Invalid code. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={styles.container}>
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
        placeholderTextColor="#94a3b8"
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
          <ActivityIndicator color="#f8fafc" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          navigation.goBack();
        }}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 12,
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
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
    backgroundColor: '#0f172a',
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    padding: 8,
  },
  backButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '500',
  },
});
