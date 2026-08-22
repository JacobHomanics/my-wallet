import { useCallback } from 'react';
import {StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

/** Amount entry for a payment request QR. */
export function RequestScreen() {
  const styles = useThemedStyles(createStyles);

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
            <Text accessibilityRole="header" style={styles.topBarTitle}>
              Request
            </Text>
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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
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
    minHeight: 52,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.5,
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
    color: c.primary,
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
    color: c.textMuted,
    marginBottom: 8,
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 12,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  fieldRowError: {
    borderColor: '#f87171',
  },
  amountPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: c.primary,
    marginRight: 4,
  },
  fieldInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: c.primary,
    paddingVertical: 12,
  },
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: c.danger,
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 28,
    backgroundColor: c.primary,
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
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
});
}
