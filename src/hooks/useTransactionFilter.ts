import { useCallback, useMemo, useState } from 'react';

import type { WalletTransaction } from '@/lib/alchemy/fetchWalletTransactions';

export type TransactionFilterId = 'all' | 'payments' | 'received';

export type TransactionFilterOption = {
  id: TransactionFilterId;
  label: string;
};

export const TRANSACTION_FILTER_OPTIONS: TransactionFilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'payments', label: 'Payments' },
  { id: 'received', label: 'Received' },
];

function isOutgoing(tx: WalletTransaction): boolean {
  if (tx.usdDelta != null && Number.isFinite(tx.usdDelta)) {
    return tx.usdDelta < 0;
  }
  return tx.tokenAmount < 0;
}

function isIncoming(tx: WalletTransaction): boolean {
  if (tx.usdDelta != null && Number.isFinite(tx.usdDelta)) {
    return tx.usdDelta > 0;
  }
  return tx.tokenAmount > 0;
}

/**
 * Filter for the Transactions screen: All / Payments (out) / Received (in).
 */
export function useTransactionFilter(transactions: WalletTransaction[]) {
  const [filterId, setFilterId] = useState<TransactionFilterId>('all');

  const filteredTransactions = useMemo(() => {
    if (filterId === 'payments') {
      return transactions.filter(isOutgoing);
    }
    if (filterId === 'received') {
      return transactions.filter(isIncoming);
    }
    return transactions;
  }, [filterId, transactions]);

  const onSelectFilter = useCallback((id: TransactionFilterId) => {
    setFilterId(id);
  }, []);

  return {
    filterId,
    options: TRANSACTION_FILTER_OPTIONS,
    filteredTransactions,
    onSelectFilter,
  };
}
