import { useAction } from 'convex/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Tier1ProtocolId } from '@/lib/identityProtocols';
import { TIER1_PROTOCOLS } from '@/lib/identityProtocols';
import { api } from '../../convex/_generated/api';

export type Tier1IdentityHit = {
  protocol: Tier1ProtocolId;
  label: string;
  displayName: string | null;
  avatarUrl: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  hasAddress: boolean;
  basename?: string;
  lensAccount?: string;
  lensHandle?: string;
  snsDomain?: string;
  nostrNip05?: string;
  nostrPubkey?: string;
};

const DEBOUNCE_MS = 350;

function mapBasenameHit(hit: {
  name: string;
  address: string;
  avatarUrl: string | null;
}): Tier1IdentityHit {
  return {
    protocol: 'basename',
    label: hit.name,
    displayName: null,
    avatarUrl: hit.avatarUrl,
    evmAddress: hit.address,
    solanaAddress: null,
    hasAddress: true,
    basename: hit.name,
  };
}

function mapLensHit(hit: {
  account: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  evmAddress: string;
}): Tier1IdentityHit {
  return {
    protocol: 'lens',
    label: `@lens/${hit.handle}`,
    displayName: hit.displayName,
    avatarUrl: hit.avatarUrl,
    evmAddress: hit.evmAddress,
    solanaAddress: null,
    hasAddress: true,
    lensAccount: hit.account,
    lensHandle: hit.handle,
  };
}

function mapSnsHit(hit: { domain: string; solanaAddress: string }): Tier1IdentityHit {
  return {
    protocol: 'sns',
    label: hit.domain,
    displayName: null,
    avatarUrl: null,
    evmAddress: null,
    solanaAddress: hit.solanaAddress,
    hasAddress: true,
    snsDomain: hit.domain,
  };
}

function mapNostrHit(hit: {
  nip05: string;
  pubkey: string;
  displayName: string | null;
  avatarUrl: string | null;
  evmAddress: string | null;
}): Tier1IdentityHit {
  const hasAddress = Boolean(hit.evmAddress);
  return {
    protocol: 'nostr',
    label: hit.nip05,
    displayName: hit.displayName,
    avatarUrl: hit.avatarUrl,
    evmAddress: hit.evmAddress,
    solanaAddress: null,
    hasAddress,
    nostrNip05: hit.nip05,
    nostrPubkey: hit.pubkey,
  };
}

/**
 * Debounced Tier-1 identity resolve/search for Basenames, Lens, SNS, and Nostr.
 */
export function useTier1Identity(protocol: Tier1ProtocolId, query: string) {
  const resolveBasename = useAction(api.basenames.resolve);
  const searchLens = useAction(api.lens.search);
  const resolveSns = useAction(api.sns.resolve);
  const resolveNostr = useAction(api.nostr.resolve);

  const [results, setResults] = useState<Tier1IdentityHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState('');
  const requestIdRef = useRef(0);

  const trimmed = query.trim();
  const config = TIER1_PROTOCOLS[protocol];
  const shouldSearch = trimmed.length >= 1;

  useEffect(() => {
    if (!shouldSearch) {
      requestIdRef.current += 1;
      setResults([]);
      setIsSearching(false);
      setErrorMessage(null);
      setResolvedQuery('');
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(() => {
      setIsSearching(true);
      setErrorMessage(null);

      void (async () => {
        try {
          let hits: Tier1IdentityHit[] = [];

          switch (protocol) {
            case 'basename': {
              const hit = await resolveBasename({ name: trimmed });
              hits = hit ? [mapBasenameHit(hit)] : [];
              break;
            }
            case 'lens': {
              const items = await searchLens({ query: trimmed, limit: 8 });
              hits = items.map(mapLensHit);
              break;
            }
            case 'sns': {
              const hit = await resolveSns({ domain: trimmed });
              hits = hit ? [mapSnsHit(hit)] : [];
              break;
            }
            case 'nostr': {
              const hit = await resolveNostr({ nip05: trimmed });
              hits = hit ? [mapNostrHit(hit)] : [];
              break;
            }
          }

          if (requestId !== requestIdRef.current) {
            return;
          }

          setResults(hits);
          setResolvedQuery(trimmed);
          setErrorMessage(null);
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setResults([]);
          setResolvedQuery(trimmed);
          setErrorMessage(
            error instanceof Error ? error.message : `Failed to search ${config.title}`,
          );
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
  }, [
    config.title,
    protocol,
    resolveBasename,
    resolveNostr,
    resolveSns,
    searchLens,
    shouldSearch,
    trimmed,
  ]);

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
    config,
  };
}
