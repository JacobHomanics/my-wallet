import { useAction } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { api } from '../../convex/_generated/api';

export type FarcasterSearchHit = {
  fid: number;
  username: string;
  displayName: string | null;
  pfpUrl: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  label: string;
  subtitle: string;
  hasAddress: boolean;
};

const DEBOUNCE_MS = 300;

function buildSubtitle(hit: {
  evmAddress: string | null;
  solanaAddress: string | null;
}): string {
  const parts: string[] = ['Farcaster'];
  if (hit.evmAddress) {
    parts.push(`EVM ${formatWalletAddress(hit.evmAddress, 6, 4)}`);
  }
  if (hit.solanaAddress) {
    parts.push(`Solana ${formatWalletAddress(hit.solanaAddress, 6, 4)}`);
  }
  if (!hit.evmAddress && !hit.solanaAddress) {
    parts.push('No verified address');
  }
  return parts.join(' · ');
}

/**
 * Debounced Farcaster username search via Neynar (Convex action).
 */
export function useFarcasterSearch(query: string) {
  const search = useAction(api.farcaster.search);
  const [results, setResults] = useState<FarcasterSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const trimmed = query.trim().replace(/^@/, '');
  const shouldSearch = trimmed.length >= 1;

  useEffect(() => {
    if (!shouldSearch) {
      requestIdRef.current += 1;
      setResults([]);
      setIsSearching(false);
      setErrorMessage(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    setErrorMessage(null);

    const timer = setTimeout(() => {
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
                subtitle: buildSubtitle(hit),
                hasAddress,
              };
            }),
          );
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
  }, []);

  const showEmpty =
    shouldSearch && !isSearching && results.length === 0 && !errorMessage;

  return {
    results,
    isSearching,
    showEmpty,
    errorMessage,
    clearResults,
  };
}
