import { useCallback, useEffect, useState } from 'react';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import {
  fetchWalletTransactions,
  type WalletTransaction,
} from '@/lib/alchemy/fetchWalletTransactions';

export type WalletTransactionsResult = {
  ready: boolean;
  transactions: WalletTransaction[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * Recent wallet transfers across EVM + Solana for the Transactions screen.
 */
export function useWalletTransactions(): WalletTransactionsResult {
  const { ready, ethereumAddress, solanaAddress } = useTokenBalances();
  const hasAddress = Boolean(ethereumAddress || solanaAddress);

  const [requestId, setRequestId] = useState(0);
  const [completedId, setCompletedId] = useState(-1);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !hasAddress) {
      return;
    }

    const controller = new AbortController();
    const id = requestId;

    void (async () => {
      try {
        const next = await fetchWalletTransactions({
          ethereumAddress,
          solanaAddress,
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        setTransactions(next);
        setError(null);
        setHasLoadedOnce(true);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          err instanceof Error ? err.message : 'Failed to load transactions',
        );
        setHasLoadedOnce(true);
      } finally {
        if (!controller.signal.aborted) {
          setCompletedId(id);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [ethereumAddress, hasAddress, ready, requestId, solanaAddress]);

  const refresh = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  const pending = ready && hasAddress && completedId !== requestId;

  return {
    ready,
    transactions,
    loading: pending && !hasLoadedOnce,
    refreshing: pending && hasLoadedOnce,
    error,
    refresh,
  };
}
