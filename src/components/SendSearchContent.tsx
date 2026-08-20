import { useState } from 'react';
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
import type { RecentSendRecipient } from '@/hooks/useRecentSendRecipients';
import { useRecentSendRecipients } from '@/hooks/useRecentSendRecipients';
import { useSendToContact } from '@/hooks/useSendToContact';
import type { HomeStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { webPressableMouseDownProps } from '@/hooks/useWebPressableMouseDown';

type SendSearchContentProps = {
  tokenId?: string;
  usdAmount?: string;
  query: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
  results: ContactSearchHit[];
  isSearching: boolean;
  showEmpty: boolean;
  onSearchFocusChange?: (focused: boolean) => void;
};

function RecipientOptionRow({
  label,
  subtitle,
  profilePhotoUrl,
  avatarSeed,
  selectable,
  onPress,
}: {
  label: string;
  subtitle: string | null;
  profilePhotoUrl: string | null | undefined;
  avatarSeed: string;
  selectable: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityLabel={`Select ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !selectable }}
      disabled={!selectable}
      onPress={onPress}
      {...webPressableMouseDownProps()}
      style={({ pressed }) => [
        styles.option,
        pressed && selectable && styles.optionPressed,
        !selectable && styles.optionDisabled,
      ]}
    >
      <Avatar
        label={label}
        photoUrl={profilePhotoUrl}
        seed={avatarSeed}
        size={40}
      />
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{label}</Text>
        {subtitle ? (
          <Text style={styles.optionDescription}>{subtitle}</Text>
        ) : !selectable ? (
          <Text style={styles.optionDescription}>No account number yet</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

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
  onSearchFocusChange,
}: SendSearchContentProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { sendToContact } = useSendToContact();
  const { recents } = useRecentSendRecipients();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const trimmed = query.trim();
  const hasResults = results.length > 0;
  const showResults = Boolean(trimmed);
  const showRecents = isSearchFocused && !trimmed && recents.length > 0;

  const selectRecent = (item: RecentSendRecipient) => {
    sendToContact(
      {
        identityId: item.identityId,
        evmAddress: item.evmAddress,
        solanaAddress: item.solanaAddress,
        username: item.username,
        name: item.name,
        profilePhotoUrl: item.profilePhotoUrl,
        isFarcaster: item.isFarcaster,
        isEns: item.isEns,
      },
      { tokenId, usdAmount },
    );
  };

  return (
    <View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel="Search usernames or account numbers"
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={() => {
            setIsSearchFocused(false);
            onSearchFocusChange?.(false);
          }}
          onChangeText={setQuery}
          onFocus={() => {
            setIsSearchFocused(true);
            onSearchFocusChange?.(true);
          }}
          placeholder="Username or account number"
          placeholderTextColor={colors.textSubtle}
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
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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

      {showRecents ? (
        <View style={styles.list}>
          <Text style={styles.sectionTitle}>Recents</Text>
          {recents.map((item) => {
            const selectable = Boolean(
              item.identityId || item.evmAddress || item.solanaAddress,
            );
            return (
              <RecipientOptionRow
                key={item.id}
                avatarSeed={item.username ?? item.id}
                label={item.label}
                onPress={() => {
                  if (!selectable) {
                    return;
                  }
                  selectRecent(item);
                }}
                profilePhotoUrl={item.profilePhotoUrl}
                selectable={selectable}
                subtitle={item.subtitle}
              />
            );
          })}
        </View>
      ) : null}

      {showResults ? (
        isSearching && !hasResults ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <View style={showEmpty ? styles.listEmpty : styles.list}>
            {showEmpty ? (
              <Text style={styles.empty}>No accounts found.</Text>
            ) : (
              <>
                {results.map((item) => {
                  const selectable = Boolean(item.identityId);
                  return (
                    <RecipientOptionRow
                      key={item.userId}
                      avatarSeed={item.username ?? item.userId}
                      label={item.label}
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
                      profilePhotoUrl={item.profilePhotoUrl}
                      selectable={selectable}
                      subtitle={item.subtitle}
                    />
                  );
                })}

                {isSearching ? (
                  <ActivityIndicator
                    color={colors.primary}
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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: c.rowBorder,
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: c.primary,
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: c.primary,
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.rowBorder,
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
    color: c.primary,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textMuted,
  },
  empty: {
    fontSize: 15,
    color: c.textSubtle,
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
    color: c.textMuted,
  },
  });
}
