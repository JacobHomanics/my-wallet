import { useCallback, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
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
import { ContactPickerContent } from '@/components/ContactPickerContent';
import { SendSearchContent } from '@/components/SendSearchContent';
import type { ContactListItem } from '@/hooks/useContacts';
import { useContactSearch } from '@/hooks/useContactSearch';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useSendToContact } from '@/hooks/useSendToContact';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Send step 1 — choose the recipient via search or contacts.
 */
export function SendScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const route = useRoute<RouteProp<HomeStackParamList, 'send'>>();
  const goHome = usePopToHome();
  const { sendToContact } = useSendToContact();
  const search = useContactSearch();
  const [searchFocused, setSearchFocused] = useState(false);

  const tokenId = route.params?.tokenId;
  const usdAmount = route.params?.usdAmount;
  const showContacts = !search.query.trim() && !searchFocused;

  const onSelectContact = useCallback(
    (contact: ContactListItem) => {
      sendToContact(contact, { tokenId, usdAmount });
    },
    [sendToContact, tokenId, usdAmount],
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
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 24) + 24,
            }}
            keyboardShouldPersistTaps="handled"
            style={styles.flex}
          >
            <SendSearchContent
              tokenId={tokenId}
              usdAmount={usdAmount}
              query={search.query}
              setQuery={search.setQuery}
              clearQuery={search.clearQuery}
              results={search.results}
              isSearching={search.isSearching}
              showEmpty={search.showEmpty}
              onSearchFocusChange={setSearchFocused}
            />

            {showContacts ? (
              <View style={styles.contactsSection}>
                <Text style={styles.contactsTitle}>Contacts</Text>
                <ContactPickerContent onSelect={onSelectContact} />
              </View>
            ) : null}
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
  contactsSection: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d1fae5',
    paddingTop: 8,
  },
  contactsTitle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#166534',
    paddingVertical: 8,
  },
});
