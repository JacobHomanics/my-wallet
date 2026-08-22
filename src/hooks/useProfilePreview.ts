import { useAuth } from '@/hooks/useAuth';
import {
  PROFILE_PREVIEW_IDENTITY_ID,
  PROFILE_PREVIEW_USERNAME,
  PROFILE_PREVIEW_WALLETS,
} from '@/lib/profilePreview';

/**
 * Signed-out profile preview: sample username, account number, and wallets.
 */
export function useProfilePreview() {
  const { isReady, isAuthenticated } = useAuth();
  const isPreview = isReady && !isAuthenticated;

  return {
    isPreview,
    username: PROFILE_PREVIEW_USERNAME,
    identityId: PROFILE_PREVIEW_IDENTITY_ID,
    wallets: PROFILE_PREVIEW_WALLETS,
  };
}
