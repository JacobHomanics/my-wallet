import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import {
  getSendDraftSnapshot,
  updateSendDraft,
} from '@/hooks/useSendDraft';
import { useSendRecipientReady } from '@/hooks/useSendRecipientReady';
import {
  encodeWalletIdentity,
  tryDecodeWalletIdentity,
} from '@/lib/walletIdentity';
import { isValidRecipientAddress } from '@/lib/validation';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Send step 1 — choose the recipient (account number and/or chain addresses).
 */
export function SendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'send'>>();
  const goHome = usePopToHome();

  const initialDraft = getSendDraftSnapshot();
  const [ethereumRecipient, setEthereumRecipientState] = useState(
    initialDraft.ethereumRecipient,
  );
  const [solanaRecipient, setSolanaRecipientState] = useState(
    initialDraft.solanaRecipient,
  );
  const [accountNumber, setAccountNumberState] = useState(() => {
    if (initialDraft.accountNumber.trim()) {
      return initialDraft.accountNumber;
    }
    if (
      !initialDraft.ethereumRecipient.trim() ||
      !initialDraft.solanaRecipient.trim()
    ) {
      return '';
    }

    try {
      return encodeWalletIdentity(
        initialDraft.ethereumRecipient.trim(),
        initialDraft.solanaRecipient.trim(),
      );
    } catch {
      return '';
    }
  });
  const [showDecodedAddresses, setShowDecodedAddresses] = useState(false);

  const { accountNumberError, canContinue } = useSendRecipientReady(
    accountNumber,
    ethereumRecipient,
    solanaRecipient,
  );

  const setEthereumRecipient = useCallback((value: string) => {
    setEthereumRecipientState(value);
  }, []);

  const setSolanaRecipient = useCallback((value: string) => {
    setSolanaRecipientState(value);
  }, []);

  const syncAccountNumberFromAddresses = useCallback(
    (nextEvm: string, nextSolana: string) => {
      const trimmedEvm = nextEvm.trim();
      const trimmedSolana = nextSolana.trim();
      const evmValid = isValidRecipientAddress(trimmedEvm, 'ethereum');
      const solanaValid = isValidRecipientAddress(trimmedSolana, 'solana');

      if (!trimmedEvm && !trimmedSolana) {
        setAccountNumberState('');
        return;
      }

      if (!evmValid || !solanaValid) {
        setAccountNumberState('');
        return;
      }

      try {
        setAccountNumberState(encodeWalletIdentity(trimmedEvm, trimmedSolana));
      } catch {
        setAccountNumberState('');
      }
    },
    [],
  );

  const setAccountNumber = useCallback(
    (value: string) => {
      setAccountNumberState(value);

      const decoded = tryDecodeWalletIdentity(value);
      if (!value.trim() || !decoded) {
        setEthereumRecipient('');
        setSolanaRecipient('');
        return;
      }

      setEthereumRecipient(decoded.evmAddress);
      setSolanaRecipient(decoded.solanaAddress);
    },
    [setEthereumRecipient, setSolanaRecipient],
  );

  const setDecodedEthereumRecipient = useCallback(
    (value: string) => {
      setEthereumRecipient(value);
      syncAccountNumberFromAddresses(value, solanaRecipient);
    },
    [setEthereumRecipient, solanaRecipient, syncAccountNumberFromAddresses],
  );

  const setDecodedSolanaRecipient = useCallback(
    (value: string) => {
      setSolanaRecipient(value);
      syncAccountNumberFromAddresses(ethereumRecipient, value);
    },
    [ethereumRecipient, setSolanaRecipient, syncAccountNumberFromAddresses],
  );

  useEffect(() => {
    updateSendDraft({
      accountNumber: accountNumber.trim(),
      ethereumRecipient,
      solanaRecipient,
    });
  }, [accountNumber, ethereumRecipient, solanaRecipient]);

  const onContinue = useCallback(() => {
    if (!canContinue) {
      return;
    }

    navigation.navigate('sendAmount', {
      tokenId: route.params?.tokenId,
      usdAmount: route.params?.usdAmount,
    });
  }, [canContinue, navigation, route.params?.tokenId, route.params?.usdAmount]);

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
            <Text style={styles.topBarTitle}>Recipient</Text>
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
            <View style={styles.formBody}>
              <Text style={styles.label}>Account Number</Text>
              <View
                style={[
                  styles.fieldRow,
                  accountNumberError ? styles.fieldRowError : null,
                ]}
              >
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setAccountNumber}
                  placeholder="AXQtNcxmNM...IfzT3I3cs"
                  placeholderTextColor="#86a894"
                  style={styles.fieldInput}
                  value={accountNumber}
                />
                {accountNumber.trim() ? (
                  <Pressable
                    accessibilityLabel="Clear account number"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      setAccountNumber('');
                    }}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#86a894" />
                  </Pressable>
                ) : null}
              </View>
              {accountNumberError ? (
                <Text style={styles.fieldError}>{accountNumberError}</Text>
              ) : null}
              <Pressable
                accessibilityLabel={
                  showDecodedAddresses ? 'Hide advanced' : 'Show advanced'
                }
                accessibilityRole="button"
                accessibilityState={{ expanded: showDecodedAddresses }}
                onPress={() => {
                  setShowDecodedAddresses((open) => !open);
                }}
                style={({ pressed }) => [
                  styles.decodedToggle,
                  pressed && styles.advancedTogglePressed,
                ]}
              >
                <Text style={styles.decodedToggleText}>Advanced</Text>
                <Ionicons
                  name={showDecodedAddresses ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#5a7d6a"
                />
              </Pressable>
              {showDecodedAddresses ? (
                <View style={styles.decodedCard}>
                  <View style={styles.decodedGroup}>
                    <Text style={styles.decodedLabel}>EVM</Text>
                    <View style={styles.decodedInputRow}>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={setDecodedEthereumRecipient}
                        placeholder="Enter a valid account number"
                        placeholderTextColor="#86a894"
                        style={styles.decodedInput}
                        value={ethereumRecipient}
                      />
                      {ethereumRecipient.trim() ? (
                        <Pressable
                          accessibilityLabel="Clear EVM address"
                          accessibilityRole="button"
                          hitSlop={8}
                          onPress={() => {
                            setDecodedEthereumRecipient('');
                          }}
                          style={styles.clearButton}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#86a894"
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.decodedDivider} />
                  <View style={styles.decodedGroup}>
                    <Text style={styles.decodedLabel}>Solana</Text>
                    <View style={styles.decodedInputRow}>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={setDecodedSolanaRecipient}
                        placeholder="Enter a valid account number"
                        placeholderTextColor="#86a894"
                        style={styles.decodedInput}
                        value={solanaRecipient}
                      />
                      {solanaRecipient.trim() ? (
                        <Pressable
                          accessibilityLabel="Clear Solana address"
                          accessibilityRole="button"
                          hitSlop={8}
                          onPress={() => {
                            setDecodedSolanaRecipient('');
                          }}
                          style={styles.clearButton}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#86a894"
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
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
    maxWidth: 640,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
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
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  form: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  formBody: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: '#fff',
    minHeight: 52,
  },
  fieldRowError: {
    borderColor: '#fca5a5',
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    fontSize: 16,
    color: '#166534',
  },
  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    marginTop: 8,
    fontSize: 13,
    color: '#b91c1c',
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  decodedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  decodedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    marginRight: 4,
  },
  decodedCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  decodedGroup: {
    gap: 8,
  },
  decodedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingLeft: 12,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 10,
    backgroundColor: '#f8fffa',
  },
  decodedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#86a894',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  decodedInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 16,
    color: '#166534',
  },
  decodedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginVertical: 10,
  },
  continueButton: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  continueButtonDisabled: {
    opacity: 0.45,
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
