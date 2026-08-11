import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { useContactSearch } from '@/hooks/useContactSearch';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendToContact } from '@/hooks/useSendToContact';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Search Cashbox usernames and account numbers during send.
 */
export function SendSearchScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sendSearch'>>();
  const { sendToContact } = useSendToContact();
  const {
    query,
    setQuery,
    clearQuery,
    results,
    isSearching,
    showEmpty,
  } = useContactSearch();

  const tokenId = route.params?.tokenId;
  const usdAmount = route.params?.usdAmount;
  const trimmed = query.trim();
  const hasResults = results.length > 0;
  const showResults = Boolean(trimmed);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('send', { tokenId, usdAmount });
  }, [navigation, tokenId, usdAmount]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.topBar}>
            {isDesktopWeb ? (
              <Pressable
                accessibilityLabel="Back"
                accessibilityRole="button"
                hitSlop={8}
                onPress={goBack}
                style={({ pressed }) => [
                  styles.webBack,
                  pressed && styles.webBackPressed,
                ]}
              >
                <Text style={styles.webBackText}>Back</Text>
              </Pressable>
            ) : (
              <BackButton accessibilityLabel="Back" onPress={goBack} />
            )}
            <Text style={styles.topBarTitle}>Search</Text>
            <View style={styles.topBarSpacer} />
          </View>

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

          <Text style={styles.hint}>
            Search Cashbox usernames or account numbers.
          </Text>

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
              <ScrollView
                contentContainerStyle={[
                  showEmpty ? styles.listEmpty : styles.list,
                  { paddingBottom: Math.max(insets.bottom, 24) + 24 },
                ]}
                keyboardShouldPersistTaps="handled"
                style={styles.flex}
              >
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
              </ScrollView>
            )
          ) : null}
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
  hint: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
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
