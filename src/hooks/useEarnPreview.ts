import { useAuth } from '@/hooks/useAuth';
import {
  EARN_PREVIEW_DEPOSITABLE_USD,
  EARN_PREVIEW_POSITION,
  EARN_PREVIEW_VAULT,
  EARN_PREVIEW_VAULT_USD,
} from '@/lib/earnPreview';

/**
 * Signed-out earn vault preview: sample balance, yield, and depositable funds.
 */
export function useEarnPreview() {
  const { isReady, isAuthenticated } = useAuth();
  const isPreview = isReady && !isAuthenticated;

  return {
    isPreview,
    vault: EARN_PREVIEW_VAULT,
    position: EARN_PREVIEW_POSITION,
    vaultBalanceUsd: EARN_PREVIEW_VAULT_USD,
    walletAssetBalance: EARN_PREVIEW_DEPOSITABLE_USD.toString(),
  };
}
