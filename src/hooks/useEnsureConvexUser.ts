import { useMutation } from 'convex/react';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useWalletIdentityId } from '@/hooks/useWalletIdentityId';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

/**
 * After auth, ensure a Convex `users` row exists for the Privy DID,
 * and keep `identityId` (account number) in sync once wallets are ready.
 */
export function useEnsureConvexUser() {
  const { isReady, user } = useAuth();
  const { ready: walletsReady, identityId } = useWalletIdentityId();
  const ensureUser = useMutation(api.users.ensureByExternalId);
  const lastSyncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      lastSyncedKeyRef.current = null;
      return;
    }

    const externalId = getPrivyExternalId(user);
    if (!externalId) {
      lastSyncedKeyRef.current = null;
      return;
    }

    // Wait for wallet readiness so we persist the account number when available.
    if (!walletsReady) {
      return;
    }

    const syncKey = `${externalId}:${identityId ?? ''}`;
    if (lastSyncedKeyRef.current === syncKey) {
      return;
    }

    lastSyncedKeyRef.current = syncKey;

    void ensureUser({
      externalId,
      identityId: identityId ?? undefined,
    }).catch((error) => {
      lastSyncedKeyRef.current = null;
      console.error('Failed to ensure Convex user', error);
    });
  }, [ensureUser, identityId, isReady, user, walletsReady]);
}
