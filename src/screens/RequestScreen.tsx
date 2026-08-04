import { useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useReceiveAmount } from '@/hooks/useReceiveAmount';
import type { HomeStackParamList } from '@/navigation/types';

/** Amount entry for a payment request QR. */
export function RequestScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const goHome = usePopToHome();
  const { currencySymbol } = useFiatDisplay();
  const { amount, amountValid, canContinue, setAmount } = useReceiveAmount();

  const amountError =
    amount.trim() && !amountValid ? 'Enter a valid amount' : null;

  const onContinue = useCallback(() => {
    if (!canContinue) {
      return;
    }
    navigation.navigate('receiveQr', { usdAmount: amount.trim() });
  }, [amount, canContinue, navigation]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
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
              <BackButton
                accessibilityLabel="Back to home"
                onPress={goHome}
              />
            )}
            <Text style={styles.topBarTitle}>Request</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.form,
              { paddingBottom: Math.max(insets.bottom, 16) + 40 },
            ]}
            keyboardShouldPersistTaps="handled"
            style={styles.flex}
          >
            <View style={styles.formInner}>
              <Text style={styles.label}>Amount</Text>
              <View
                style={[
                  styles.fieldRow,
                  amountError ? styles.fieldRowError : null,
                ]}
              >
                <Text style={styles.amountPrefix}>{currencySymbol}</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor="#86a894"
                  style={styles.fieldInput}
                  value={amount}
                />
              </View>
              {amountError ? (
                <Text style={styles.fieldError}>{amountError}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={!canContinue}
                onPress={onContinue}
                style={({ pressed }) => [
                  styles.continueButton,
                  !canContinue && styles.continueButtonDisabled,
                  pressed && canContinue && styles.continueButtonPressed,
                ]}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  flex: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#166534',
  },
  topBarSpacer: {
    width: 44,
  },
  webBack: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  webBackPressed: {
    opacity: 0.6,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#166534',
  },
  form: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formInner: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    marginBottom: 8,
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  fieldRowError: {
    borderColor: '#f87171',
  },
  amountPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: '#166534',
    marginRight: 4,
  },
  fieldInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#166534',
    paddingVertical: 12,
  },
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 28,
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonPressed: {
    opacity: 0.85,
  },
  continueButtonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
});
