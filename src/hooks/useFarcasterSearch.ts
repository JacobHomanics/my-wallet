import { useAction } from 'convex/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '../../convex/_generated/api';

export type FarcasterSearchHit = {
  fid: number;
  username: string;
  displayName: string | null;
  pfpUrl: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  label: string;
  hasAddress: boolean;
};

const DEBOUNCE_MS = 300;

/**
 * Debounced Farcaster username search via Neynar (Convex action).
 */
export function useFarcasterSearch(query: string) {
  const search = useAction(api.farcaster.search);
  const [results, setResults] = useState<FarcasterSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState('');
  const requestIdRef = useRef(0);

  const trimmed = query.trim().replace(/^@/, '');
  const shouldSearch = trimmed.length >= 1;

  useEffect(() => {
    if (!shouldSearch) {
      requestIdRef.current += 1;
      return;
    }

    const requestId = ++requestIdRef.current;

    const timer = setTimeout(() => {
      setIsSearching(true);
      setErrorMessage(null);

      void (async () => {
        try {
          const hits = await search({ query: trimmed, limit: 8 });
          if (requestId !== requestIdRef.current) {
            return;
          }

          setResults(
            hits.map((hit) => {
              const hasAddress = Boolean(hit.evmAddress || hit.solanaAddress);
              return {
                ...hit,
                label: `@${hit.username}`,
                hasAddress,
              };
            }),
          );
          setResolvedQuery(trimmed);
          setErrorMessage(null);
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to search Farcaster';
          setErrorMessage(message);
          setResults([]);
          setResolvedQuery(trimmed);
        } finally {
          if (requestId === requestIdRef.current) {
            setIsSearching(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [search, shouldSearch, trimmed]);

  const clearResults = useCallback(() => {
    requestIdRef.current += 1;
    setResults([]);
    setIsSearching(false);
    setErrorMessage(null);
    setResolvedQuery('');
  }, []);

  const visibleResults = useMemo(() => {
    if (!shouldSearch || resolvedQuery !== trimmed) {
      return [];
    }
    return results;
  }, [results, resolvedQuery, shouldSearch, trimmed]);

  const visibleError =
    shouldSearch && resolvedQuery === trimmed ? errorMessage : null;
  const visibleSearching = shouldSearch && isSearching;

  const showEmpty =
    shouldSearch &&
    !visibleSearching &&
    resolvedQuery === trimmed &&
    visibleResults.length === 0 &&
    !visibleError;

  return {
    results: visibleResults,
    isSearching: visibleSearching,
    showEmpty,
    errorMessage: visibleError,
    clearResults,
  };
}
