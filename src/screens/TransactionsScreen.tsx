import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
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

export function TransactionsScreen() {
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

        {error ? (
          <View style={styles.loadErrorFooter}>
            <Text style={styles.loadErrorText}>
              {"Couldn't load transactions."}
            </Text>
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={onRefresh}
              style={({ pressed }) => [pressed && styles.detailsLinkPressed]}
            >
              <Text style={styles.detailsLinkText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color="#166534" style={styles.loader} />
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
              error ? null : (
                <Text style={styles.empty}>{emptyMessage}</Text>
              )
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 2,
    gap: 2,
    backgroundColor: '#dcfce7',
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
    backgroundColor: '#ffffff',
  },
  filterOptionPressed: {
    opacity: 0.75,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
  },
  filterOptionTextSelected: {
    color: '#166534',
  },
  loadErrorFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 24,
    paddingBottom: 12,
  },
  loadErrorText: {
    fontSize: 15,
    color: '#5a7d6a',
    textAlign: 'center',
  },
  detailsLinkPressed: {
    opacity: 0.6,
  },
  detailsLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5a7d6a',
    textDecorationLine: 'underline',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
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
