import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { useAddContact } from '@/hooks/useAddContact';
import { useContactSearch } from '@/hooks/useContactSearch';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToContacts } from '@/hooks/usePopToContacts';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import type { ContactsStackParamList } from '@/navigation/types';

export function NewContactScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goContacts = usePopToContacts();
  const navigation =
    useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const { query, setQuery, results, isSearching, showEmpty } =
    useContactSearch();
  const { add, isAdding, errorMessage } = useAddContact();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to contacts"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goContacts}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to contacts"
              onPress={goContacts}
            />
          )}
          <Text style={styles.topBarTitle}>New Contact</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Search</Text>
          <TextInput
            accessibilityLabel="Search by username"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            editable={!isAdding}
            onChangeText={setQuery}
            placeholder="Username"
            placeholderTextColor="#C37A7A"
            style={styles.input}
            value={query}
          />
          <Text style={styles.hint}>
            Tap a username to add them to your contacts.
          </Text>

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          {isSearching || isAdding ? (
            <ActivityIndicator color="#D33D3D" style={styles.loader} />
          ) : null}

          {results.length > 0 ? (
            <View style={styles.results}>
              {results.map((hit) => (
                <Pressable
                  key={hit.userId}
                  accessibilityLabel={`Add ${hit.label}`}
                  accessibilityRole="button"
                  disabled={isAdding || (!hit.username && !hit.identityId)}
                  onPress={() => {
                    void (async () => {
                      if (!hit.username && !hit.identityId) {
                        return;
                      }
                      const ok = await add(hit.userId);
                      if (ok) {
                        goContacts();
                      }
                    })();
                  }}
                  style={({ pressed }) => [
                    styles.resultCard,
                    pressed && styles.resultCardPressed,
                    (isAdding || (!hit.username && !hit.identityId)) &&
                      styles.resultCardDisabled,
                  ]}
                >
                  <Avatar
                    label={hit.label}
                    photoUrl={hit.profilePhotoUrl}
                    seed={hit.username ?? hit.userId}
                    size={40}
                  />
                  <View style={styles.resultText}>
                    <Text style={styles.resultLabel}>{hit.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {showEmpty ? (
            <Text style={styles.empty}>No accounts found.</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showAdvanced }}
            onPress={toggleAdvanced}
            style={({ pressed }) => [
              styles.advancedToggle,
              pressed && styles.advancedTogglePressed,
            ]}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced
                ? 'Hide advanced details'
                : 'Show advanced details'}
            </Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#9B5A5A"
            />
          </Pressable>

          {showAdvanced ? (
            <View style={styles.advancedCard}>
              <Pressable
                accessibilityLabel="Add Farcaster contact"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('newFarcasterContact');
                }}
                style={({ pressed }) => [
                  styles.advancedButton,
                  pressed && styles.advancedButtonPressed,
                ]}
              >
                <Text style={styles.advancedButtonText}>Farcaster</Text>
                <Ionicons name="chevron-forward" size={18} color="#C37A7A" />
              </Pressable>
              <View style={styles.advancedDivider} />
              <Pressable
                accessibilityLabel="Add ENS contact"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('newEnsContact');
                }}
                style={({ pressed }) => [
                  styles.advancedButton,
                  pressed && styles.advancedButtonPressed,
                ]}
              >
                <Text style={styles.advancedButtonText}>ENS</Text>
                <Ionicons name="chevron-forward" size={18} color="#C37A7A" />
              </Pressable>
              <View style={styles.advancedDivider} />
              <Pressable
                accessibilityLabel="Add contact by raw addresses"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('newRawAddressContact');
                }}
                style={({ pressed }) => [
                  styles.advancedButton,
                  pressed && styles.advancedButtonPressed,
                ]}
              >
                <Text style={styles.advancedButtonText}>Raw address(es)</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#C37A7A"
                />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
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
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B5A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5BFA9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#D33D3D',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#C37A7A',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
  },
  loader: {
    marginTop: 16,
  },
  results: {
    marginTop: 12,
    gap: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5BFA9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultCardPressed: {
    opacity: 0.85,
    backgroundColor: '#FFF4E6',
  },
  resultCardDisabled: {
    opacity: 0.55,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
  },
  empty: {
    marginTop: 16,
    fontSize: 15,
    color: '#C37A7A',
    textAlign: 'center',
  },
  advancedToggle: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B5A5A',
  },
  advancedCard: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5BFA9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  advancedButtonPressed: {
    backgroundColor: '#FFF4E6',
  },
  advancedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F5BFA9',
    marginHorizontal: 16,
  },
});
