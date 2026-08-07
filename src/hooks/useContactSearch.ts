import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';

import { api } from '../../convex/_generated/api';

export type ContactSearchHit = {
  username: string;
  label: string;
};

/**
 * Prefix search contacts by Convex username.
 */
export function useContactSearch() {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const prefix = trimmed.replace(/^@/, '').toLowerCase();
  const shouldSearch = prefix.length >= 1;

  const convexUsers = useQuery(
    api.users.search,
    shouldSearch ? { query: trimmed } : 'skip',
  );

  const results = useMemo((): ContactSearchHit[] => {
    if (!convexUsers?.length) {
      return [];
    }

    return convexUsers
      .filter((user) => typeof user.username === 'string')
      .map((user) => ({
        username: user.username!,
        label: `@${user.username}`,
      }));
  }, [convexUsers]);

  const isSearching = shouldSearch && convexUsers === undefined;

  const showEmpty =
    shouldSearch && !isSearching && results.length === 0;

  return {
    query,
    setQuery,
    results,
    isSearching,
    showEmpty,
  };
}
