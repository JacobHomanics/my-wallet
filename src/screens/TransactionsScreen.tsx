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
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useTransactionFilter } from '@/hooks/useTransactionFilter';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import type { WalletTransaction } from '@/lib/alchemy/fetchWalletTransactions';

function formatTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
}

function TransactionRow({
  item,
  formatSignedUsd,
}: {
  item: WalletTransaction;
  formatSignedUsd: (usd: number) => string | null;
}) {
  const amountLabel = (() => {
    if (item.usdDelta != null && Number.isFinite(item.usdDelta)) {
      return formatSignedUsd(item.usdDelta) ?? '—';
    }
    const absolute = formatTokenAmountLabel(Math.abs(item.tokenAmount));
    const sign = item.tokenAmount >= 0 ? '+' : '-';
    return `${sign}${absolute} ${item.tokenSymbol}`;
  })();
  const isIn =
    (item.usdDelta != null && item.usdDelta > 0) ||
    (item.usdDelta == null && item.tokenAmount > 0);
  const isOut =
    (item.usdDelta != null && item.usdDelta < 0) ||
    (item.usdDelta == null && item.tokenAmount < 0);

  const recipientsLabel =
    item.recipients.length > 0
      ? item.recipients.map((address) => formatWalletAddress(address)).join(', ')
      : 'Unknown Transaction';

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.recipients} numberOfLines={2}>
          {recipientsLabel}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestampMs)}</Text>
      </View>
      <Text
        style={[
          styles.amount,
          isIn && styles.amountIn,
          isOut && styles.amountOut,
        ]}
      >
        {amountLabel}
      </Text>
    </View>
  );
}

function formatTokenAmountLabel(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '0';
  }
  if (value >= 1000) {
    return value.toFixed(2).replace(/\.?0+$/, '');
  }
  if (value >= 1) {
    return value.toFixed(4).replace(/\.?0+$/, '');
  }
  return value.toFixed(6).replace(/\.?0+$/, '');
}

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const { formatFromUsd, defaultFormattedZero } = useFiatDisplay();
  const {
    transactions,
    loading,
    refreshing,
    error,
    refresh,
  } = useWalletTransactions();
  const { filterId, options, filteredTransactions, onSelectFilter } =
    useTransactionFilter(transactions);

  const formatSignedUsd = useCallback(
    (usd: number) => {
      if (!Number.isFinite(usd)) {
        return null;
      }
      if (usd === 0) {
        return defaultFormattedZero;
      }
      const absolute = formatFromUsd(Math.abs(usd));
      if (!absolute) {
        return null;
      }
      return usd > 0 ? `+${absolute}` : `-${absolute}`;
    },
    [defaultFormattedZero, formatFromUsd],
  );

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
          <ActivityIndicator color="#0f172a" style={styles.loader} />
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
                tintColor="#0f172a"
              />
            }
            renderItem={({ item }) => (
              <TransactionRow
                formatSignedUsd={formatSignedUsd}
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
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
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
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 2,
    gap: 2,
    backgroundColor: '#f1f5f9',
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
    color: '#64748b',
  },
  filterOptionTextSelected: {
    color: '#0f172a',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#94a3b8',
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
    color: '#b91c1c',
    textAlign: 'center',
  },
  errorBanner: {
    marginBottom: 12,
    fontSize: 13,
    color: '#b91c1c',
  },
  retryButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: '#f8fafc',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  timestamp: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94a3b8',
  },
  recipients: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  amountIn: {
    color: '#15803d',
  },
  amountOut: {
    color: '#b91c1c',
  },
});
