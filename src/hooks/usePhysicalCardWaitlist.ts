import { useMutation, useQuery } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

/**
 * Physical card waitlist interest stored on Convex `users`.
 */
export function usePhysicalCardWaitlist() {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;
  const convexUser = useQuery(
    api.users.getByExternalId,
    externalId ? { externalId } : 'skip',
  );
  const joinPhysicalCardWaitlist = useMutation(api.users.joinPhysicalCardWaitlist);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasJoined = convexUser?.physicalCardWaitlistJoinedAt != null;
  const isLoading = externalId != null && convexUser === undefined;

  const join = useCallback(async () => {
    if (!externalId || isJoining || hasJoined) {
      return hasJoined;
    }

    setIsJoining(true);
    setErrorMessage(null);

    try {
      await joinPhysicalCardWaitlist({ externalId });
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to join the waitlist';
      setErrorMessage(message);
      return false;
    } finally {
      setIsJoining(false);
    }
  }, [externalId, hasJoined, isJoining, joinPhysicalCardWaitlist]);

  return {
    hasJoined,
    join,
    isLoading,
    isJoining,
    errorMessage,
  };
}
