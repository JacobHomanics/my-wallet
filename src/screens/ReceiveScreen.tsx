import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
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
import QRCodeStyled from 'react-native-qrcode-styled';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useReceiveAddressUrl } from '@/hooks/useReceiveAddressUrl';
import { useReceiveAmount } from '@/hooks/useReceiveAmount';
import type { HomeStackParamList } from '@/navigation/types';

export function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const goHome = usePopToHome();
  const { currencySymbol } = useFiatDisplay();
  const { amount, amountValid, canContinue, setAmount } = useReceiveAmount();
  const { ready, url } = useReceiveAddressUrl();
  const { copy, isCopied } = useCopyToClipboard();

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
            <Text style={styles.topBarTitle}>Receive</Text>
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
              <View style={styles.shareSection}>
                {!ready || !url ? (
                  <ActivityIndicator color="#0f172a" style={styles.loader} />
                ) : (
                  <>
                    <View style={styles.qrWrap}>
                      <QRCodeStyled
                        data={url}
                        padding={16}
                        size={220}
                        color="#0f172a"
                        style={styles.qr}
                      />
                    </View>

                    <Pressable
                      accessibilityLabel={
                        isCopied('url') ? 'Link copied' : 'Copy receive link'
                      }
                      accessibilityRole="button"
                      onPress={() => {
                        void copy(url, 'url');
                      }}
                      style={({ pressed }) => [
                        styles.copyLinkButton,
                        pressed && styles.copyLinkButtonPressed,
                      ]}
                    >
                      <Ionicons
                        name={isCopied('url') ? 'checkmark' : 'link-outline'}
                        size={18}
                        color={isCopied('url') ? '#15803d' : '#0f172a'}
                      />
                      <Text
                        style={[
                          styles.copyLinkText,
                          isCopied('url') && styles.copyLinkTextCopied,
                        ]}
                      >
                        {isCopied('url') ? 'Link copied' : 'Copy link'}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.orDivider}>
                <View style={styles.orDividerLine} />
                <Text style={styles.orLabel}>or request an amount</Text>
                <View style={styles.orDividerLine} />
              </View>

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
                  placeholderTextColor="#94a3b8"
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
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
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
    color: '#0f172a',
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
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
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
    color: '#0f172a',
    marginRight: 4,
  },
  fieldInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
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
    backgroundColor: '#0f172a',
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  shareSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  orDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5e1',
  },
  orLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
    flexShrink: 0,
  },
  loader: {
    marginTop: 12,
  },
  qrWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
  },
  qr: {
    backgroundColor: '#ffffff',
  },
  copyLinkButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  copyLinkButtonPressed: {
    opacity: 0.85,
  },
  copyLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  copyLinkTextCopied: {
    color: '#15803d',
  },
});
