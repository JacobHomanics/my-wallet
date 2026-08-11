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
import { ContactPickerModal } from '@/components/ContactPickerModal';
import { useContactPickerModal } from '@/hooks/useContactPickerModal';
import type { ContactListItem } from '@/hooks/useContacts';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import {
  getSendDraftSnapshot,
  updateSendDraft,
} from '@/hooks/useSendDraft';
import { useSendRecipientReady } from '@/hooks/useSendRecipientReady';
import { useSendToContact } from '@/hooks/useSendToContact';
import { useSyncSendRecipientFromDraft } from '@/hooks/useSyncSendRecipientFromDraft';
import {
  encodeWalletIdentity,
  tryDecodeWalletIdentity,
} from '@/lib/walletIdentity';
import { isValidRecipientAddress } from '@/lib/validation';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Send step 1 — choose the recipient via search, contacts, or addresses.
 */
export function SendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'send'>>();
  const goHome = usePopToHome();
  const { pickerOpen, openPicker, closePicker } = useContactPickerModal();
  const { sendToContact } = useSendToContact();

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

  const { canContinue } = useSendRecipientReady(
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

  useSyncSendRecipientFromDraft({
    setAccountNumber: setAccountNumberState,
    setEthereumRecipient: setEthereumRecipientState,
    setSolanaRecipient: setSolanaRecipientState,
    setShowDecodedAddresses,
  });

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

  const onSelectContact = useCallback(
    (contact: ContactListItem) => {
      if (contact.identityId) {
        setAccountNumber(contact.identityId);
      } else {
        const nextEvm = contact.evmAddress?.trim() ?? '';
        const nextSolana = contact.solanaAddress?.trim() ?? '';
        setEthereumRecipient(nextEvm);
        setSolanaRecipient(nextSolana);
        syncAccountNumberFromAddresses(nextEvm, nextSolana);
        if (nextEvm || nextSolana) {
          setShowDecodedAddresses(true);
        }
      }

      closePicker();
      sendToContact(contact, {
        tokenId: route.params?.tokenId,
        usdAmount: route.params?.usdAmount,
      });
    },
    [
      closePicker,
      route.params?.tokenId,
      route.params?.usdAmount,
      sendToContact,
      setAccountNumber,
      setEthereumRecipient,
      setSolanaRecipient,
      syncAccountNumberFromAddresses,
    ],
  );

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
              <Pressable
                accessibilityLabel="Search usernames and account numbers"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('sendSearch', {
                    tokenId: route.params?.tokenId,
                    usdAmount: route.params?.usdAmount,
                  });
                }}
                style={({ pressed }) => [
                  styles.contactsButton,
                  pressed && styles.contactsButtonPressed,
                ]}
              >
                <Ionicons name="search-outline" size={20} color="#D33D3D" />
                <Text style={styles.contactsButtonText}>Search</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Choose from contacts"
                accessibilityRole="button"
                onPress={openPicker}
                style={({ pressed }) => [
                  styles.contactsButton,
                  styles.secondaryButtonSpacing,
                  pressed && styles.contactsButtonPressed,
                ]}
              >
                <Ionicons name="people-outline" size={20} color="#D33D3D" />
                <Text style={styles.contactsButtonText}>Contacts</Text>
              </Pressable>

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
                  color="#9B5A5A"
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
                        placeholder="0x…"
                        placeholderTextColor="#C37A7A"
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
                            color="#C37A7A"
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
                        placeholder="Solana address"
                        placeholderTextColor="#C37A7A"
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
                            color="#C37A7A"
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

      <ContactPickerModal
        visible={pickerOpen}
        onClose={closePicker}
        onSelect={onSelectContact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
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
    color: '#D33D3D',
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
    color: '#D33D3D',
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
  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  decodedToggle: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  decodedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B5A5A',
    marginRight: 4,
  },
  decodedCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5BFA9',
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
    borderColor: '#F5BFA9',
    borderRadius: 10,
    backgroundColor: '#FFF4E6',
  },
  decodedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C37A7A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  decodedInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 16,
    color: '#D33D3D',
  },
  decodedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#FFDCC8',
    marginVertical: 10,
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFDCC8',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  secondaryButtonSpacing: {
    marginTop: 12,
  },
  contactsButtonPressed: {
    opacity: 0.85,
  },
  contactsButtonText: {
    color: '#D33D3D',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: '#D33D3D',
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
    color: '#FFF4E6',
    fontSize: 16,
    fontWeight: '600',
  },
});
