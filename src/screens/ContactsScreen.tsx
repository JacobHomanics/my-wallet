import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useContacts } from '@/hooks/useContacts';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import type { HomeStackParamList } from '@/navigation/types';

export function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { contacts, isLoading } = useContacts();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
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
            <BackButton accessibilityLabel="Back to home" onPress={goHome} />
          )}
          <Text style={styles.topBarTitle}>Contacts</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ActivityIndicator color="#166534" style={styles.loader} />
          ) : contacts.length === 0 ? (
            <Text style={styles.empty}>No contacts yet.</Text>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <Text style={styles.contactLabel}>{contact.label}</Text>
                {contact.subtitle ? (
                  <Text style={styles.contactSubtitle}>{contact.subtitle}</Text>
                ) : null}
              </View>
            ))
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('newContact');
            }}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>New Contact</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
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
  list: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
  contactRow: {
    width: '100%',
    maxWidth: 420,
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  contactSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  button: {
    alignSelf: 'center',
    marginTop: 24,
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
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
