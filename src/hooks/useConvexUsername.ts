import { useQuery } from 'convex/react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

/**
 * Convex `users.username` for the authenticated Privy user, if a row exists.
 */
export function useConvexUsername(): {
  username: string | null;
  isLoading: boolean;
} {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;

  const convexUser = useQuery(
    api.users.getByExternalId,
    externalId ? { externalId } : 'skip',
  );

  return {
    username: convexUser?.username ?? null,
    isLoading: externalId != null && convexUser === undefined,
  };
}
