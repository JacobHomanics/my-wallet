import { useCallback } from 'react';
import {StyleSheet, 
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { TransactionRow } from '@/components/TransactionRow';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useTransactionFilter } from '@/hooks/useTransactionFilter';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export function TransactionsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const { formatSignedFromUsd } = useFiatDisplay();
  const {
    transactions,
    loading,
    refreshing,
    error,
    refresh,
  } = useWalletTransactions();
  const { filterId, options, filteredTransactions, onSelectFilter } =
    useTransactionFilter(transactions);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const emptyMessage =
    filterId === 'payments'
      ? 'No payments yet.'
      : filterId === 'received'
        ? 'No received transfers yet.'
        : 'No transactions yet.';

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
          <Text style={styles.topBarTitle}>Transactions</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.filterRow}>
          {options.map((option) => {
            const selected = filterId === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityLabel={`Show ${option.label} transactions`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelectFilter(option.id);
                }}
                style={({ pressed }) => [
                  styles.filterOption,
                  selected && styles.filterOptionSelected,
                  pressed && styles.filterOptionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selected && styles.filterOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error && transactions.length === 0 ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={
              filteredTransactions.length === 0
                ? styles.listEmpty
                : styles.listContent
            }
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>{emptyMessage}</Text>
            }
            ListHeaderComponent={
              error ? <Text style={styles.errorBanner}>{error}</Text> : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#166534"
              />
            }
            renderItem={({ item }) => (
              <TransactionRow
                formatSignedUsd={formatSignedFromUsd}
                item={item}
              />
            )}
            style={styles.list}
          />
        )}
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 2,
    gap: 2,
    backgroundColor: c.surfaceMuted,
    borderRadius: 10,
  },
  filterOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterOptionSelected: {
    backgroundColor: c.surface,
  },
  filterOptionPressed: {
    opacity: 0.75,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
  },
  filterOptionTextSelected: {
    color: c.primary,
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: c.textSubtle,
    textAlign: 'center',
  },
  errorBlock: {
    marginTop: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: c.danger,
    textAlign: 'center',
  },
  errorBanner: {
    marginBottom: 12,
    fontSize: 13,
    color: c.danger,
  },
  retryButton: {
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: c.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
});
}
