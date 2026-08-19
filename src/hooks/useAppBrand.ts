import {
  APP_NAME,
  APP_TAGLINE,
  NETWORK_NAME,
  REWARD_POINTS_LABEL,
} from '@/lib/brand';

export function useAppBrand() {
  return {
    name: APP_NAME,
    tagline: APP_TAGLINE,
    networkName: NETWORK_NAME,
    rewardPointsLabel: REWARD_POINTS_LABEL,
  };
}
