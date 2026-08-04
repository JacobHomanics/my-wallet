import { useNavigation } from '@react-navigation/native';
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
import { useSendLoginCode } from '@/hooks/useSendLoginCode';
import type { LoginMethod } from '@/lib/privy/context/AuthFlowContext.shared';
import { isValidEmail, isValidPhoneNumber } from '@/lib/validation';
import type { RootStackParamList } from '@/navigation/types';

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const { send } = useSendLoginCode();
  const [method, setMethod] = useState<LoginMethod>('email');
  const [value, setValue] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid =
    method === 'email' ? isValidEmail(value) : isValidPhoneNumber(value);

  const handleContinue = async () => {
    if (!isValid || isPending) {
      return;
    }

    setErrorMessage(null);
    setIsPending(true);
    Keyboard.dismiss();

    try {
      await send(method, value);
      navigation.navigate('loginVerify', { method, value: value.trim() });
    } catch (error) {
      console.error(error);
      setErrorMessage(
        method === 'email'
          ? 'Could not send an email code. Please try again.'
          : 'Could not send an SMS code. Please try again.',
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isDesktopWeb ? (
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <BackButton accessibilityLabel="Back to welcome" />
        </View>
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title}>Log in</Text>
        <Text style={styles.subtitle}>
          Continue with email or phone number.
        </Text>

        <View style={styles.methodRow}>
          <MethodChip
            label="Email"
            selected={method === 'email'}
            onPress={() => {
              setMethod('email');
              setValue('');
              setErrorMessage(null);
            }}
          />
          <MethodChip
            label="Phone"
            selected={method === 'phone'}
            onPress={() => {
              setMethod('phone');
              setValue('');
              setErrorMessage(null);
            }}
          />
        </View>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={method === 'email' ? 'email' : 'tel'}
          keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
          placeholder={
            method === 'email' ? 'you@example.com' : '+1 (555) 555-5555'
          }
          placeholderTextColor="#86a894"
          style={styles.input}
          value={value}
          onChangeText={setValue}
          editable={!isPending}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!isValid || isPending}
          onPress={() => {
            void handleContinue();
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
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function MethodChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
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
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86d4a4',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#365c45',
  },
  chipTextSelected: {
    color: '#f0fdf4',
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
