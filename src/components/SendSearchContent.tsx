import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { ContactSearchHit } from '@/hooks/useContactSearch';
import { useSendToContact } from '@/hooks/useSendToContact';
import type { HomeStackParamList } from '@/navigation/types';

type SendSearchContentProps = {
  tokenId?: string;
  usdAmount?: string;
  query: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
  results: ContactSearchHit[];
  isSearching: boolean;
  showEmpty: boolean;
};

/**
 * Username / account-number search UI used by Send Search and Recipient.
 */
export function SendSearchContent({
  tokenId,
  usdAmount,
  query,
  setQuery,
  clearQuery,
  results,
  isSearching,
  showEmpty,
}: SendSearchContentProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { sendToContact } = useSendToContact();

  const trimmed = query.trim();
  const hasResults = results.length > 0;
  const showResults = Boolean(trimmed);

  return (
    <View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#5a7d6a" />
        <TextInput
          accessibilityLabel="Search usernames or account numbers"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Username or account number"
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

      <Pressable
        accessibilityLabel="Advanced search"
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate('sendAdvancedSearch', { tokenId, usdAmount });
        }}
        style={({ pressed }) => [
          styles.advancedSearch,
          pressed && styles.advancedSearchPressed,
        ]}
      >
        <Text style={styles.advancedSearchText}>Advanced search</Text>
      </Pressable>

      {showResults ? (
        isSearching && !hasResults ? (
          <ActivityIndicator color="#166534" style={styles.loader} />
        ) : (
          <View style={showEmpty ? styles.listEmpty : styles.list}>
            {showEmpty ? (
              <Text style={styles.empty}>No accounts found.</Text>
            ) : (
              <>
                {results.map((item) => {
                  const selectable = Boolean(item.identityId);
                  return (
                    <Pressable
                      key={item.userId}
                      accessibilityLabel={`Select ${item.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !selectable }}
                      disabled={!selectable}
                      onPress={() => {
                        if (!item.identityId) {
                          return;
                        }
                        sendToContact(
                          {
                            identityId: item.identityId,
                            evmAddress: null,
                            solanaAddress: null,
                            username: item.username,
                            name: null,
                            profilePhotoUrl: item.profilePhotoUrl,
                          },
                          { tokenId, usdAmount },
                        );
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

                {isSearching ? (
                  <ActivityIndicator
                    color="#166534"
                    style={styles.inlineLoader}
                  />
                ) : null}
              </>
            )}
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 8,
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
  loader: {
    marginTop: 24,
  },
  inlineLoader: {
    marginTop: 16,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  listEmpty: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
  advancedSearch: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 24,
  },
  advancedSearchPressed: {
    opacity: 0.65,
  },
  advancedSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
  },
});
