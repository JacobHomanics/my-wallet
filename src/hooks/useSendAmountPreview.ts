import { useAuth } from '@/hooks/useAuth';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  SEND_PREVIEW_AVAILABLE_USD,
  SEND_PREVIEW_TOKENS,
} from '@/lib/sendPreview';

/**
 * Signed-out pay amount preview: sample USDC balance matching home.
 */
export function useSendAmountPreview() {
  const { isReady, isAuthenticated } = useAuth();
  const { formatFromUsd, defaultFormattedZero } = useFiatDisplay();
  const isPreview = isReady && !isAuthenticated;

  return {
    isPreview,
    tokens: SEND_PREVIEW_TOKENS,
    availableUsd: SEND_PREVIEW_AVAILABLE_USD,
    availableLabel:
      formatFromUsd(SEND_PREVIEW_AVAILABLE_USD) ?? defaultFormattedZero,
  };
}
