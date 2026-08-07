import { useMutation } from 'convex/react';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

/**
 * After auth, ensure a Convex `users` row exists for the Privy DID.
 */
export function useEnsureConvexUser() {
  const { isReady, user } = useAuth();
  const ensureUser = useMutation(api.users.ensureByExternalId);
  const attemptedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      attemptedForUserRef.current = null;
      return;
    }

    const externalId = getPrivyExternalId(user);
    if (!externalId) {
      attemptedForUserRef.current = null;
      return;
    }

    if (attemptedForUserRef.current === externalId) {
      return;
    }

    attemptedForUserRef.current = externalId;

    void ensureUser({ externalId }).catch((error) => {
      attemptedForUserRef.current = null;
      console.error('Failed to ensure Convex user', error);
    });
  }, [ensureUser, isReady, user]);
}
