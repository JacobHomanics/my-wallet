import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { SendAdvancedSearchTabs } from '@/components/SendAdvancedSearchTabs';
import type { ContactSearchHit } from '@/hooks/useContactSearch';
import {
  useRecipientSearch,
  type RecipientSearchRow,
} from '@/hooks/useRecipientSearch';
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
  onSearchTabChange?: (isZitiCashboxTab: boolean) => void;
};

function RecipientOptionRow({
  label,
  subtitle,
  extraLines,
  profilePhotoUrl,
  avatarSeed,
  selectable,
  showFarcasterBadge,
  showEnsBadge,
  onPress,
}: RecipientSearchRow) {
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
        showFarcasterBadge={showFarcasterBadge}
        showEnsBadge={showEnsBadge}
      />
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{label}</Text>
        {subtitle ? (
          <Text style={styles.optionDescription}>{subtitle}</Text>
        ) : !selectable ? (
          <Text style={styles.optionDescription}>No account number yet</Text>
        ) : null}
        {extraLines?.map((line) => (
          <Text key={line} style={styles.optionDescription}>
            {line}
          </Text>
        ))}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

/**
 * Username / account-number search UI used by Send Search and Recipient.
 * Advanced layout reuses this field for Farcaster, ENS, and wallet search.
 */
export function SendSearchContent({
  tokenId,
  usdAmount,
  query,
  setQuery,
  clearQuery,
  results,
  isSearching: contactIsSearching,
  showEmpty: contactShowEmpty,
  onSearchFocusChange,
  onSearchTabChange,
}: SendSearchContentProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const search = useRecipientSearch({
    query,
    tokenId,
    usdAmount,
    contactResults: results,
    contactIsSearching,
    contactShowEmpty,
    isSearchFocused,
  });

  const trimmed = query.trim();

  return (
    <View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={search.accessibilityLabel}
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
          placeholder={search.placeholder}
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

      {search.showTabs ? (
        <SendAdvancedSearchTabs
          selectedTab={search.selectedTab}
          onSelect={(tab) => {
            search.onSelectTab(tab);
            onSearchTabChange?.(tab === 'zitiCashbox');
          }}
        />
      ) : null}

      {search.showAdvancedSearchButton ? (
        <Pressable
          accessibilityLabel="Advanced search"
          accessibilityRole="button"
          onPress={search.showAdvancedSearch}
          style={({ pressed }) => [
            styles.advancedSearch,
            pressed && styles.advancedSearchPressed,
          ]}
        >
          <Text style={styles.advancedSearchText}>Advanced search</Text>
        </Pressable>
      ) : null}

      {search.canHideAdvancedSearch ? (
        <Pressable
          accessibilityLabel="Hide advanced search"
          accessibilityRole="button"
          onPress={() => {
            search.hideAdvancedSearch();
            onSearchTabChange?.(true);
          }}
          style={({ pressed }) => [
            styles.advancedSearch,
            pressed && styles.advancedSearchPressed,
          ]}
        >
          <Text style={styles.advancedSearchText}>Hide advanced search</Text>
        </Pressable>
      ) : null}

      {search.errorMessage ? (
        <Text style={styles.error}>{search.errorMessage}</Text>
      ) : null}

      {search.showRecents ? (
        <View style={styles.list}>
          <Text style={styles.sectionTitle}>Recents</Text>
          {search.recentRows.map((item) => (
            <RecipientOptionRow key={item.key} {...item} />
          ))}
        </View>
      ) : null}

      {search.showResults &&
      (search.isSearching ||
        search.showEmpty ||
        search.resultRows.length > 0) ? (
        search.isSearching && search.resultRows.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <View style={search.showEmpty ? styles.listEmpty : styles.list}>
            {search.showEmpty ? (
              <Text style={styles.empty}>{search.emptyMessage}</Text>
            ) : (
              <>
                {search.resultRows.map((item) => (
                  <RecipientOptionRow key={item.key} {...item} />
                ))}

                {search.isSearching ? (
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
    error: {
      marginHorizontal: 24,
      marginTop: 8,
      fontSize: 13,
      lineHeight: 18,
      color: c.danger,
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
