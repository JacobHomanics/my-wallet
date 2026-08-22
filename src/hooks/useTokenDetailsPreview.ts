import { useAuth } from '@/hooks/useAuth';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  SEND_PREVIEW_AVAILABLE_USD,
  SEND_PREVIEW_TOKENS,
} from '@/lib/sendPreview';

/**
 * Signed-out token details preview: sample USDC matching home.
 */
export function useTokenDetailsPreview() {
  const { isReady, isAuthenticated } = useAuth();
  const { formatFromUsd, defaultFormattedZero } = useFiatDisplay();
  const isPreview = isReady && !isAuthenticated;

  return {
    isPreview,
    tokens: SEND_PREVIEW_TOKENS,
    totalUsd: SEND_PREVIEW_AVAILABLE_USD,
    availableLabel:
      formatFromUsd(SEND_PREVIEW_AVAILABLE_USD) ?? defaultFormattedZero,
  };
}
