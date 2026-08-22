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
import { SendAdvancedSearchTabs } from '@/components/SendAdvancedSearchTabs';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useNewContactSearch } from '@/hooks/useNewContactSearch';
import { usePopToContacts } from '@/hooks/usePopToContacts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export function NewContactScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goContacts = usePopToContacts();
  const search = useNewContactSearch(goContacts);
  const trimmed = search.query.trim();

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
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              accessibilityLabel={search.accessibilityLabel}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              editable={!search.isAdding}
              onChangeText={search.setQuery}
              placeholder={search.placeholder}
              placeholderTextColor={colors.textSubtle}
              style={styles.searchInput}
              value={search.query}
            />
            {trimmed ? (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={8}
                onPress={search.clearQuery}
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
              onSelect={search.onSelectTab}
              style={styles.tabsAboveFootnote}
            />
          ) : null}

          {search.showAdvancedToggle ? (
            <Pressable
              accessibilityLabel={
                search.showAdvanced
                  ? 'Hide advanced details'
                  : 'Show advanced details'
              }
              accessibilityRole="button"
              accessibilityState={{ expanded: search.showAdvanced }}
              onPress={search.toggleAdvancedSearch}
              style={({ pressed }) => [
                styles.advancedToggle,
                search.showAdvanced
                  ? styles.advancedToggleUnderTabs
                  : styles.advancedToggleUnderInput,
                pressed && styles.advancedTogglePressed,
              ]}
            >
              <Text style={styles.advancedToggleText}>
                {search.showAdvanced
                  ? 'Hide advanced details'
                  : 'Show advanced details'}
              </Text>
              <Ionicons
                name={search.showAdvanced ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}

          {search.errorMessage ? (
            <Text style={styles.error}>{search.errorMessage}</Text>
          ) : null}

          {search.showResults &&
          (search.isSearching ||
            search.isAdding ||
            search.showEmpty ||
            search.resultRows.length > 0) ? (
            search.isSearching && search.resultRows.length === 0 ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : search.showEmpty ? (
              <Text style={styles.empty}>{search.emptyMessage}</Text>
            ) : (
              <View style={styles.results}>
                {search.resultRows.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityLabel={`Add ${item.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !item.selectable }}
                    disabled={!item.selectable}
                    onPress={item.onPress}
                    style={({ pressed }) => [
                      styles.resultCard,
                      pressed && item.selectable && styles.resultCardPressed,
                      !item.selectable && styles.resultCardDisabled,
                    ]}
                  >
                    <Avatar
                      label={item.label}
                      photoUrl={item.profilePhotoUrl}
                      seed={item.avatarSeed}
                      size={40}
                      showFarcasterBadge={item.showFarcasterBadge}
                      showEnsBadge={item.showEnsBadge}
                    />
                    <View style={styles.resultText}>
                      <Text style={styles.resultLabel}>{item.label}</Text>
                      {item.subtitle ? (
                        <Text style={styles.resultDescription}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                      {item.extraLines?.map((line) => (
                        <Text key={line} style={styles.resultDescription}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  </Pressable>
                ))}
                {search.isSearching || search.isAdding ? (
                  <ActivityIndicator
                    color={colors.primary}
                    style={styles.inlineLoader}
                  />
                ) : null}
              </View>
            )
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
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
      color: c.primary,
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
      color: c.primary,
    },
    body: {
      paddingTop: 8,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 24,
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
    tabsAboveFootnote: {
      marginBottom: 0,
    },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      alignSelf: 'center',
      paddingHorizontal: 4,
    },
    advancedToggleUnderInput: {
      marginTop: 0,
      paddingTop: 2,
      paddingBottom: 4,
    },
    advancedToggleUnderTabs: {
      marginTop: 2,
      paddingTop: 2,
      paddingBottom: 4,
    },
    advancedTogglePressed: {
      opacity: 0.65,
    },
    advancedToggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    error: {
      marginHorizontal: 24,
      marginTop: 8,
      fontSize: 13,
      lineHeight: 18,
      color: c.danger,
    },
    loader: {
      marginTop: 24,
    },
    inlineLoader: {
      marginTop: 16,
    },
    results: {
      marginHorizontal: 24,
      marginTop: 12,
      gap: 8,
    },
    resultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.rowBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    resultCardPressed: {
      opacity: 0.85,
      backgroundColor: c.bg,
    },
    resultCardDisabled: {
      opacity: 0.55,
    },
    resultText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    resultLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: c.primary,
    },
    resultDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textMuted,
    },
    empty: {
      marginTop: 16,
      fontSize: 15,
      color: c.textSubtle,
      textAlign: 'center',
    },
  });
}
