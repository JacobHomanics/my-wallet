import { useQuery } from 'convex/react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * Convex `users._id` for the authenticated Privy user, if a row exists.
 */
export function useConvexUserId(): {
  userId: Id<'users'> | null;
  isLoading: boolean;
} {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;

  const convexUser = useQuery(
    api.users.getByExternalId,
    externalId ? { externalId } : 'skip',
  );

  return {
    userId: convexUser?._id ?? null,
    isLoading: externalId != null && convexUser === undefined,
  };
}
