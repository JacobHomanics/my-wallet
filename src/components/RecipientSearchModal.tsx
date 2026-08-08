import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import {
  useContactSearch,
  type ContactSearchHit,
} from '@/hooks/useContactSearch';
import {
  useFarcasterSearch,
  type FarcasterSearchHit,
} from '@/hooks/useFarcasterSearch';

export type RecipientSearchSelection =
  | { kind: 'cashbox'; hit: ContactSearchHit }
  | { kind: 'farcaster'; hit: FarcasterSearchHit };

type RecipientSearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (selection: RecipientSearchSelection) => void;
};

/**
 * Page-sheet modal for searching Cashbox users and Farcaster profiles.
 */
export function RecipientSearchModal({
  visible,
  onClose,
  onSelect,
}: RecipientSearchModalProps) {
  const insets = useSafeAreaInsets();
  const {
    query,
    setQuery,
    clearQuery,
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

  useEffect(() => {
    if (!visible) {
      clearQuery();
    }
  }, [clearQuery, visible]);

  const trimmed = query.trim();
  const isSearching = isCashboxSearching || isFarcasterSearching;
  const hasResults = cashboxResults.length > 0 || farcasterResults.length > 0;
  const showEmpty =
    Boolean(trimmed) &&
    !isSearching &&
    !hasResults &&
    (showCashboxEmpty || showFarcasterEmpty);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <View
        style={[
          styles.modalContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.modalTopBar}>
          <Text style={styles.modalTitle}>Search</Text>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalClose,
              pressed && styles.modalClosePressed,
            ]}
          >
            <Ionicons name="close" size={22} color="#166534" />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#5a7d6a" />
          <TextInput
            accessibilityLabel="Search usernames, account numbers, or Farcaster"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={visible}
            onChangeText={setQuery}
            placeholder="Username, account number, or Farcaster"
            placeholderTextColor="#86a894"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {trimmed ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={clearQuery}
              style={({ pressed }) => [
                styles.clearSearchButton,
                pressed && styles.clearSearchButtonPressed,
              ]}
            >
              <Ionicons name="close-circle" size={18} color="#5a7d6a" />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.hint}>
          Search Cashbox usernames, account numbers, or Farcaster usernames.
        </Text>

        {isSearching && !hasResults ? (
          <ActivityIndicator color="#166534" style={styles.loader} />
        ) : (
          <ScrollView
            contentContainerStyle={
              !trimmed || showEmpty ? styles.listEmpty : styles.list
            }
            keyboardShouldPersistTaps="handled"
          >
            {!trimmed ? (
              <Text style={styles.empty}>
                Start typing a username, account number, or Farcaster name.
              </Text>
            ) : showEmpty ? (
              <Text style={styles.empty}>No accounts found.</Text>
            ) : (
              <>
                {cashboxResults.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cashbox</Text>
                    {cashboxResults.map((item) => {
                      const selectable = Boolean(item.identityId);
                      return (
                        <Pressable
                          key={item.userId}
                          accessibilityLabel={`Select ${item.label}`}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !selectable }}
                          disabled={!selectable}
                          onPress={() => {
                            onSelect({ kind: 'cashbox', hit: item });
                          }}
                          style={({ pressed }) => [
                            styles.option,
                            pressed && selectable && styles.optionPressed,
                            !selectable && styles.optionDisabled,
                          ]}
                        >
                          <Avatar
                            label={item.label}
                            photoUrl={item.profilePhotoUrl}
                            seed={item.username ?? item.userId}
                            size={40}
                          />
                          <View style={styles.optionText}>
                            <Text style={styles.optionLabel}>{item.label}</Text>
                            {item.subtitle ? (
                              <Text style={styles.optionDescription}>
                                {item.subtitle}
                              </Text>
                            ) : !selectable ? (
                              <Text style={styles.optionDescription}>
                                No account number yet
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#86a894"
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {farcasterResults.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Farcaster</Text>
                    {farcasterResults.map((item) => {
                      const selectable = item.hasAddress;
                      return (
                        <Pressable
                          key={item.fid}
                          accessibilityLabel={`Select ${item.label}`}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !selectable }}
                          disabled={!selectable}
                          onPress={() => {
                            onSelect({ kind: 'farcaster', hit: item });
                          }}
                          style={({ pressed }) => [
                            styles.option,
                            pressed && selectable && styles.optionPressed,
                            !selectable && styles.optionDisabled,
                          ]}
                        >
                          <Avatar
                            label={item.label}
                            photoUrl={item.pfpUrl}
                            seed={item.username}
                            size={40}
                          />
                          <View style={styles.optionText}>
                            <Text style={styles.optionLabel}>{item.label}</Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#86a894"
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {farcasterError ? (
                  <Text style={styles.error}>{farcasterError}</Text>
                ) : null}

                {isSearching ? (
                  <ActivityIndicator
                    color="#166534"
                    style={styles.inlineLoader}
                  />
                ) : null}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1fae5',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#166534',
    paddingLeft: 40,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePressed: {
    opacity: 0.6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: '#166534',
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchButtonPressed: {
    opacity: 0.7,
  },
  hint: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  loader: {
    marginTop: 40,
  },
  inlineLoader: {
    marginTop: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
  },
  empty: {
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
    textAlign: 'center',
  },
});
