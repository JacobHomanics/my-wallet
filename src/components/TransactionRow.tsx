import { StyleSheet, Text, View } from 'react-native';

import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { WalletTransaction } from '@/lib/alchemy/fetchWalletTransactions';

function formatTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
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

export function TransactionRow({
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F5BFA9',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  timestamp: {
    fontSize: 13,
    fontWeight: '400',
    color: '#C37A7A',
  },
  recipients: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D33D3D',
    fontVariant: ['tabular-nums'],
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
    fontVariant: ['tabular-nums'],
  },
  amountIn: {
    color: '#15803d',
  },
  amountOut: {
    color: '#b91c1c',
  },
});
