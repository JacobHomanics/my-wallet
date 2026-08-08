import { Ionicons } from '@expo/vector-icons';
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
import { useFarcasterSearch } from '@/hooks/useFarcasterSearch';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useNewContactAdvanced } from '@/hooks/useNewContactAdvanced';
import { usePopToContacts } from '@/hooks/usePopToContacts';

export function NewContactScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goContacts = usePopToContacts();
  const {
    query,
    setQuery,
    results: cashboxResults,
    isSearching: isCashboxSearching,
    showEmpty: showCashboxEmpty,
  } = useContactSearch();
  const {
    results: farcasterResults,
    isSearching: isFarcasterSearching,
    showEmpty: showFarcasterEmpty,
    errorMessage: farcasterError,
  } = useFarcasterSearch(query);
  const { add, addAddresses, addFarcaster, isAdding, errorMessage } =
    useAddContact();
  const {
    showAdvanced,
    toggleAdvanced,
    name,
    setName,
    trimmedName,
    evmAddress,
    setEvmAddress,
    solanaAddress,
    setSolanaAddress,
    canSubmit: canSubmitAddresses,
    evmValid,
    solanaValid,
    trimmedEvm,
    trimmedSolana,
  } = useNewContactAdvanced();

  const isSearching = isCashboxSearching || isFarcasterSearching;
  const hasResults = cashboxResults.length > 0 || farcasterResults.length > 0;
  const showEmpty =
    Boolean(query.trim()) &&
    !isSearching &&
    !hasResults &&
    (showCashboxEmpty || showFarcasterEmpty);

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
            accessibilityLabel="Search by username or Farcaster"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            editable={!isAdding}
            onChangeText={setQuery}
            placeholder="Username or Farcaster"
            placeholderTextColor="#86a894"
            style={styles.input}
            value={query}
          />
          <Text style={styles.hint}>
            Tap a Cashbox or Farcaster user to add them to your contacts.
          </Text>

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}
          {farcasterError ? (
            <Text style={styles.error}>{farcasterError}</Text>
          ) : null}

          {isSearching || isAdding ? (
            <ActivityIndicator color="#166534" style={styles.loader} />
          ) : null}

          {cashboxResults.length > 0 ? (
            <View style={styles.results}>
              <Text style={styles.sectionTitle}>Cashbox</Text>
              {cashboxResults.map((hit) => (
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
                    {hit.subtitle ? (
                      <Text style={styles.resultSubtitle}>{hit.subtitle}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {farcasterResults.length > 0 ? (
            <View style={styles.results}>
              <Text style={styles.sectionTitle}>Farcaster</Text>
              {farcasterResults.map((hit) => (
                <Pressable
                  key={hit.fid}
                  accessibilityLabel={`Add ${hit.label}`}
                  accessibilityRole="button"
                  disabled={isAdding || !hit.hasAddress}
                  onPress={() => {
                    void (async () => {
                      if (!hit.hasAddress) {
                        return;
                      }
                      const ok = await addFarcaster({
                        farcasterFid: hit.fid,
                        farcasterUsername: hit.username,
                        farcasterPfpUrl: hit.pfpUrl,
                        name: hit.displayName,
                        evmAddress: hit.evmAddress,
                        solanaAddress: hit.solanaAddress,
                      });
                      if (ok) {
                        goContacts();
                      }
                    })();
                  }}
                  style={({ pressed }) => [
                    styles.resultCard,
                    pressed && styles.resultCardPressed,
                    (isAdding || !hit.hasAddress) && styles.resultCardDisabled,
                  ]}
                >
                  <Avatar
                    label={hit.label}
                    photoUrl={hit.pfpUrl}
                    seed={hit.username}
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
              color="#5a7d6a"
            />
          </Pressable>

          {showAdvanced ? (
            <View style={styles.advancedCard}>
              <View style={styles.advancedGroup}>
                <Text style={styles.advancedLabel}>Name</Text>
                <TextInput
                  accessibilityLabel="Contact name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isAdding}
                  onChangeText={setName}
                  placeholder="Name"
                  placeholderTextColor="#86a894"
                  style={styles.advancedInput}
                  value={name}
                />
              </View>

              <View style={styles.advancedDivider} />

              <View style={styles.advancedGroup}>
                <Text style={styles.advancedLabel}>EVM</Text>
                <TextInput
                  accessibilityLabel="EVM address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAdding}
                  onChangeText={setEvmAddress}
                  placeholder="0x…"
                  placeholderTextColor="#86a894"
                  style={[
                    styles.advancedInput,
                    trimmedEvm && !evmValid ? styles.inputError : null,
                  ]}
                  value={evmAddress}
                />
                {trimmedEvm && !evmValid ? (
                  <Text style={styles.error}>Enter a valid EVM address.</Text>
                ) : null}
              </View>

              <View style={styles.advancedDivider} />

              <View style={styles.advancedGroup}>
                <Text style={styles.advancedLabel}>Solana</Text>
                <TextInput
                  accessibilityLabel="Solana address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAdding}
                  onChangeText={setSolanaAddress}
                  placeholder="Solana address"
                  placeholderTextColor="#86a894"
                  style={[
                    styles.advancedInput,
                    trimmedSolana && !solanaValid ? styles.inputError : null,
                  ]}
                  value={solanaAddress}
                />
                {trimmedSolana && !solanaValid ? (
                  <Text style={styles.error}>
                    Enter a valid Solana address.
                  </Text>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canSubmitAddresses || isAdding}
                onPress={() => {
                  void (async () => {
                    const ok = await addAddresses({
                      name: trimmedName,
                      evmAddress: trimmedEvm || undefined,
                      solanaAddress: trimmedSolana || undefined,
                    });
                    if (ok) {
                      goContacts();
                    }
                  })();
                }}
                style={({ pressed }) => [
                  styles.addButton,
                  (!canSubmitAddresses || isAdding) && styles.addButtonDisabled,
                  pressed &&
                    canSubmitAddresses &&
                    !isAdding &&
                    styles.addButtonPressed,
                ]}
              >
                {isAdding ? (
                  <ActivityIndicator color="#f0fdf4" />
                ) : (
                  <Text style={styles.addButtonText}>Add contact</Text>
                )}
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
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#166534',
  },
  inputError: {
    borderColor: '#fca5a5',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultCardPressed: {
    opacity: 0.85,
    backgroundColor: '#f0fdf4',
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
    color: '#166534',
  },
  resultSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  empty: {
    marginTop: 16,
    fontSize: 15,
    color: '#86a894',
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
    color: '#5a7d6a',
  },
  advancedCard: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  advancedGroup: {
    gap: 8,
  },
  advancedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  advancedInput: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#166534',
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
  addButton: {
    marginTop: 4,
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: '#f0fdf4',
    fontSize: 15,
    fontWeight: '600',
  },
});
