import { useAuth } from '@/hooks/useAuth';
import { REWARDS_PREVIEW_POINTS } from '@/lib/rewardsPreview';

/**
 * Signed-out rewards preview: sample points balance.
 */
export function useRewardsPreview() {
  const { isReady, isAuthenticated } = useAuth();
  const isPreview = isReady && !isAuthenticated;

  return {
    isPreview,
    balanceFormatted: REWARDS_PREVIEW_POINTS,
  };
}
