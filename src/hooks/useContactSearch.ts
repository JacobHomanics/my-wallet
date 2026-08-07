import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

export type ContactSearchHit = {
  userId: Id<'users'>;
  username: string;
  label: string;
};

/**
 * Prefix search users by Convex username (excludes the signed-in user).
 */
export function useContactSearch() {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const prefix = trimmed.replace(/^@/, '').toLowerCase();
  const shouldSearch = prefix.length >= 1;

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

    return convexUsers
      .filter((hit) => typeof hit.username === 'string')
      .map((hit) => ({
        userId: hit._id,
        username: hit.username!,
        label: `@${hit.username}`,
      }));
  }, [convexUsers]);

  const isSearching = shouldSearch && convexUsers === undefined;

  const showEmpty = shouldSearch && !isSearching && results.length === 0;

  return {
    query,
    setQuery,
    results,
    isSearching,
    showEmpty,
  };
}
