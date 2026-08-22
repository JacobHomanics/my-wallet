import { useAuth } from '@/hooks/useAuth';
import { TRANSACTIONS_PREVIEW } from '@/lib/transactionsPreview';

/**
 * Signed-out transactions preview: sample payments and received transfers.
 */
export function useTransactionsPreview() {
  const { isReady, isAuthenticated } = useAuth();
  const isPreview = isReady && !isAuthenticated;

  return {
    isPreview,
    transactions: TRANSACTIONS_PREVIEW,
  };
}
