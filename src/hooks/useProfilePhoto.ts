import { useQuery } from 'convex/react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

/**
 * Profile photo URL for the authenticated Convex user, if set.
 */
export function useProfilePhoto(): {
  profilePhotoUrl: string | null;
  profilePhotoId: string | null;
  isLoading: boolean;
} {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;

  const convexUser = useQuery(
    api.users.getByExternalId,
    externalId ? { externalId } : 'skip',
  );

  return {
    profilePhotoUrl: convexUser?.profilePhotoUrl ?? null,
    profilePhotoId: convexUser?.profilePhotoId ?? null,
    isLoading: externalId != null && convexUser === undefined,
  };
}
