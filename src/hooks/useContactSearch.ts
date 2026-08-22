import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';

import { useAuth } from '@/hooks/useAuth';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

export type ContactSearchHit = {
  userId: Id<'users'>;
  username: string | null;
  identityId: string | null;
  profilePhotoUrl: string | null;
  label: string;
  subtitle: string | null;
};

function identitySubtitle(identityId: string): string {
  return `Account ${formatWalletAddress(identityId, 6, 4)}`;
}

/**
 * Prefix search users by username or account number (excludes the signed-in user).
 */
export function useContactSearch(options?: { enabled?: boolean }) {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const shouldSearch = (options?.enabled ?? true) && trimmed.length >= 1;

  const convexUsers = useQuery(
    api.users.search,
    shouldSearch
      ? {
          query: trimmed,
          excludeExternalId: externalId ?? undefined,
        }
      : 'skip',
  );

  const results = useMemo((): ContactSearchHit[] => {
    if (!convexUsers?.length) {
      return [];
    }

    return convexUsers.map((hit) => {
      const username =
        typeof hit.username === 'string' ? hit.username : null;
      const identityId =
        typeof hit.identityId === 'string' ? hit.identityId : null;

      return {
        userId: hit._id,
        username,
        identityId,
        profilePhotoUrl:
          typeof hit.profilePhotoUrl === 'string' ? hit.profilePhotoUrl : null,
        label: username ? `@${username}` : (identityId ?? 'User'),
        subtitle:
          !username && identityId ? identitySubtitle(identityId) : null,
      };
    });
  }, [convexUsers]);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const isSearching = shouldSearch && convexUsers === undefined;

  const showEmpty = shouldSearch && !isSearching && results.length === 0;

  return {
    query,
    setQuery,
    clearQuery,
    results,
    isSearching,
    showEmpty,
  };
}
