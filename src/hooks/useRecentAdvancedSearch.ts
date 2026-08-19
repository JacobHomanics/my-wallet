import { useEffect, useMemo, useSyncExternalStore } from 'react';

import type { EnsResolveHit } from '@/hooks/useEnsResolve';
import type { FarcasterSearchHit } from '@/hooks/useFarcasterSearch';
import type { SendAdvancedSearchTabId } from '@/hooks/useSendAdvancedSearchTab';
import type { WalletBalanceSearchHit } from '@/hooks/useWalletBalanceSearch';
import {
  readPersistedJson,
  writePersistedJson,
} from '@/lib/persistedJsonStorage';

const STORAGE_KEY = 'recentAdvancedSearch';
const MAX_RECENTS = 10;

export type RecentFarcasterSearch = {
  id: string;
  fid: number;
  username: string;
  displayName: string | null;
  pfpUrl: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  lastUsedAt: number;
};

export type RecentEnsSearch = {
  id: string;
  name: string;
  address: string;
  avatarUrl: string | null;
  lastUsedAt: number;
};

export type RecentWalletSearch = {
  id: string;
  address: string;
  chain: 'ethereum' | 'solana';
  lastUsedAt: number;
};

type AdvancedSearchRecents = {
  farcaster: RecentFarcasterSearch[];
  ens: RecentEnsSearch[];
  wallets: RecentWalletSearch[];
};

type RecentAdvancedSearchListener = () => void;

const EMPTY: AdvancedSearchRecents = {
  farcaster: [],
  ens: [],
  wallets: [],
};

let recents: AdvancedSearchRecents = EMPTY;
let hydrated = false;
let hydrateStarted = false;
const listeners = new Set<RecentAdvancedSearchListener>();

function subscribe(listener: RecentAdvancedSearchListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function getSnapshot(): AdvancedSearchRecents {
  return recents;
}

async function hydrateRecents(): Promise<void> {
  if (hydrated) {
    return;
  }
  hydrated = true;
  const stored =
    (await readPersistedJson<AdvancedSearchRecents>(STORAGE_KEY)) ?? EMPTY;
  recents = {
    farcaster: stored.farcaster ?? [],
    ens: stored.ens ?? [],
    wallets: stored.wallets ?? [],
  };
  notify();
}

function startHydrate(): void {
  if (hydrateStarted) {
    return;
  }
  hydrateStarted = true;
  void hydrateRecents();
}

function persistRecents(next: AdvancedSearchRecents): void {
  recents = next;
  notify();
  void writePersistedJson(STORAGE_KEY, next);
}

function prepend<T extends { id: string }>(
  list: T[],
  entry: T,
): T[] {
  return [entry, ...list.filter((item) => item.id !== entry.id)].slice(
    0,
    MAX_RECENTS,
  );
}

export function addRecentFarcasterSearch(hit: FarcasterSearchHit): void {
  startHydrate();

  const entry: RecentFarcasterSearch = {
    id: `fc:${hit.fid}`,
    fid: hit.fid,
    username: hit.username,
    displayName: hit.displayName,
    pfpUrl: hit.pfpUrl,
    evmAddress: hit.evmAddress,
    solanaAddress: hit.solanaAddress,
    lastUsedAt: Date.now(),
  };

  persistRecents({
    ...recents,
    farcaster: prepend(recents.farcaster, entry),
  });
}

export function addRecentEnsSearch(hit: EnsResolveHit): void {
  startHydrate();

  const entry: RecentEnsSearch = {
    id: `ens:${hit.name.toLowerCase()}`,
    name: hit.name,
    address: hit.address,
    avatarUrl: hit.avatarUrl,
    lastUsedAt: Date.now(),
  };

  persistRecents({
    ...recents,
    ens: prepend(recents.ens, entry),
  });
}

export function addRecentWalletSearch(hit: WalletBalanceSearchHit): void {
  startHydrate();

  const entry: RecentWalletSearch = {
    id: `wallet:${hit.chain}:${hit.address.toLowerCase()}`,
    address: hit.address,
    chain: hit.chain,
    lastUsedAt: Date.now(),
  };

  persistRecents({
    ...recents,
    wallets: prepend(recents.wallets, entry),
  });
}

/**
 * Recently chosen advanced-search results, persisted locally per tab.
 */
export function useRecentAdvancedSearch(
  tab: 'farcaster',
): { recents: RecentFarcasterSearch[]; ready: boolean };
export function useRecentAdvancedSearch(
  tab: 'ens',
): { recents: RecentEnsSearch[]; ready: boolean };
export function useRecentAdvancedSearch(
  tab: 'wallets',
): { recents: RecentWalletSearch[]; ready: boolean };
export function useRecentAdvancedSearch(tab: SendAdvancedSearchTabId): {
  recents:
    | RecentFarcasterSearch[]
    | RecentEnsSearch[]
    | RecentWalletSearch[];
  ready: boolean;
} {
  useEffect(() => {
    startHydrate();
  }, []);

  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const recentsForTab = useMemo(() => store[tab], [store, tab]);

  return {
    recents: recentsForTab,
    ready: hydrated,
  };
}
