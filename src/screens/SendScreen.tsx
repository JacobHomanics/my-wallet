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
import { useSendToContact } from '@/hooks/useSendToContact';
import { useSyncSendRecipientFromDraft } from '@/hooks/useSyncSendRecipientFromDraft';
import {
  encodeWalletIdentity,
  tryDecodeWalletIdentity,
} from '@/lib/walletIdentity';
import { isValidRecipientAddress } from '@/lib/validation';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Send step 1 — choose the recipient via search or contacts.
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

  useSyncSendRecipientFromDraft({
    setAccountNumber: setAccountNumberState,
    setEthereumRecipient: setEthereumRecipientState,
    setSolanaRecipient: setSolanaRecipientState,
  });

  useEffect(() => {
    updateSendDraft({
      accountNumber: accountNumber.trim(),
      ethereumRecipient,
      solanaRecipient,
    });
  }, [accountNumber, ethereumRecipient, solanaRecipient]);

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
              <View style={styles.buttonRow}>
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
                  <Ionicons name="search-outline" size={20} color="#166534" />
                  <Text style={styles.contactsButtonText}>Search</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Choose from contacts"
                  accessibilityRole="button"
                  onPress={openPicker}
                  style={({ pressed }) => [
                    styles.contactsButton,
                    pressed && styles.contactsButtonPressed,
                  ]}
                >
                  <Ionicons name="people-outline" size={20} color="#166534" />
                  <Text style={styles.contactsButtonText}>Contacts</Text>
                </Pressable>
              </View>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 108,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 20,
    paddingVertical: 36,
    borderRadius: 10,
  },
  contactsButtonPressed: {
    opacity: 0.85,
  },
  contactsButtonText: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '600',
  },
});
