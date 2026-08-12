import { useCallback, useEffect, useMemo, useState } from 'react';

import { useChainPriority } from '@/hooks/useChainPriority';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getAlchemyApiKey } from '@/lib/alchemy/alchemyCredentials';
import {
  fetchTokensByAddress,
  fetchTokensByAddressAllNetworks,
  sortOwnedTokens,
  type OwnedToken,
  type WalletNetworksQuery,
} from '@/lib/alchemy/fetchTokensByAddress';
import {
  ALCHEMY_EVM_NETWORKS,
  ALCHEMY_SOLANA_NETWORKS,
} from '@/lib/alchemy/networks';

export type TokenBalancesResult = {
  ready: boolean;
  ethereumAddress: string | null;
  solanaAddress: string | null;
  tokens: OwnedToken[];
  totalUsd: number | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
  /** Silent background refetch — does not toggle the pull-to-refresh spinner. */
  poll: () => void;
};

const CACHE_TTL_MS = 60_000;

type TokenBalancesCache = {
  key: string;
  tokens: OwnedToken[];
  error: string | null;
  fetchedAt: number;
};

type FetchSnapshot = {
  fetchId: string;
  tokens: OwnedToken[];
  error: string | null;
};

/** Shared across Home + Token Details so navigating does not refetch immediately. */
let tokenBalancesCache: TokenBalancesCache | null = null;

function cacheKey(
  ethereumAddress: string | null,
  solanaAddress: string | null,
) {
  return `${ethereumAddress ?? ''}|${solanaAddress ?? ''}`;
}

function readFreshCache(key: string): TokenBalancesCache | null {
  if (
    !tokenBalancesCache ||
    tokenBalancesCache.key !== key ||
    Date.now() - tokenBalancesCache.fetchedAt > CACHE_TTL_MS
  ) {
    return null;
  }
  return tokenBalancesCache;
}

function makeFetchId(key: string, reloadKey: number) {
  return `${key}:${reloadKey}`;
}

/**
 * Loads fungible token balances for Privy Ethereum + Solana addresses via Alchemy.
 */
export function useTokenBalances(): TokenBalancesResult {
  const { selectedChainPriorityId } = useChainPriority();
  const { ready: walletsReady, wallets } = useUserWallets();
  const ethereumAddress =
    wallets.find((wallet) => wallet.chain === 'ethereum')?.address ?? null;
  const solanaAddress =
    wallets.find((wallet) => wallet.chain === 'solana')?.address ?? null;
  const hasAddress = Boolean(ethereumAddress || solanaAddress);
  const key = cacheKey(ethereumAddress, solanaAddress);
  const apiKey = getAlchemyApiKey();
  const missingApiKey = hasAddress && !apiKey;

  const [reloadKey, setReloadKey] = useState(0);
  const [refreshFetchId, setRefreshFetchId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<FetchSnapshot | null>(() => {
    if (!hasAddress) {
      return null;
    }
    const cached = readFreshCache(key);
    if (!cached) {
      return null;
    }
    return {
      fetchId: makeFetchId(key, 0),
      tokens: cached.tokens,
      error: cached.error,
    };
  });

  const fetchId = makeFetchId(key, reloadKey);
  const isRefresh = refreshFetchId === fetchId;
  const freshCache = hasAddress && !isRefresh ? readFreshCache(key) : null;
  const snapshotMatches = snapshot?.fetchId === fetchId;
  const snapshotForKey =
    snapshot && snapshot.fetchId.startsWith(`${key}:`) ? snapshot : null;

  useEffect(() => {
    if (!walletsReady || !hasAddress || !apiKey) {
      return;
    }

    if (!isRefresh && readFreshCache(key)) {
      return;
    }

    const controller = new AbortController();
    const queries: WalletNetworksQuery[] = [];
    if (ethereumAddress) {
      queries.push({
        address: ethereumAddress,
        networks: ALCHEMY_EVM_NETWORKS,
      });
    }
    if (solanaAddress) {
      queries.push({
        address: solanaAddress,
        networks: ALCHEMY_SOLANA_NETWORKS,
      });
    }

    void (async () => {
      try {
        // Fetch EVM and Solana separately so one chain failure does not wipe the other.
        const results = await Promise.allSettled(
          queries.map((query) =>
            query.address === ethereumAddress
              ? fetchTokensByAddressAllNetworks({
                  apiKey,
                  address: query.address,
                  networks: query.networks,
                  signal: controller.signal,
                })
              : fetchTokensByAddress({
                  apiKey,
                  queries: [query],
                  signal: controller.signal,
                }),
          ),
        );
        if (controller.signal.aborted) {
          return;
        }

        const nextTokens: OwnedToken[] = [];
        const errors: string[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            nextTokens.push(...result.value);
          } else if (
            result.reason &&
            !(
              result.reason instanceof Error &&
              result.reason.name === 'AbortError'
            )
          ) {
            errors.push(
              result.reason instanceof Error
                ? result.reason.message
                : 'Failed to load tokens',
            );
          }
        }

        const nextError =
          nextTokens.length === 0 && errors.length > 0
            ? (errors[0] ?? 'Failed to load tokens')
            : errors.length > 0
              ? (errors[0] ?? null)
              : null;

        tokenBalancesCache = {
          key,
          tokens: nextTokens,
          error: nextError,
          fetchedAt: Date.now(),
        };

        setSnapshot({
          fetchId,
          tokens: nextTokens,
          error: nextError,
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Failed to load tokens';
        setSnapshot((previous) => ({
          fetchId,
          tokens:
            isRefresh && previous?.fetchId.startsWith(`${key}:`)
              ? previous.tokens
              : [],
          error: message,
        }));
      } finally {
        if (!controller.signal.aborted) {
          setRefreshFetchId((current) =>
            current === fetchId ? null : current,
          );
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    apiKey,
    ethereumAddress,
    solanaAddress,
    fetchId,
    hasAddress,
    isRefresh,
    key,
    walletsReady,
  ]);

  const visibleTokens = useMemo(() => {
    const unsorted = !hasAddress
      ? []
      : snapshotMatches && snapshot
        ? snapshot.tokens
        : freshCache
          ? freshCache.tokens
          : snapshotForKey
            ? snapshotForKey.tokens
            : [];

    return sortOwnedTokens(unsorted, selectedChainPriorityId);
  }, [
    freshCache,
    hasAddress,
    selectedChainPriorityId,
    snapshot,
    snapshotForKey,
    snapshotMatches,
  ]);

  const visibleError = missingApiKey
    ? 'Missing EXPO_PUBLIC_ALCHEMY_API_KEY'
    : !hasAddress
      ? null
      : snapshotMatches && snapshot
        ? snapshot.error
        : freshCache
          ? freshCache.error
          : snapshotForKey
            ? snapshotForKey.error
            : null;

  const settled = Boolean(snapshotMatches || freshCache);
  const refreshing = Boolean(isRefresh && !snapshotMatches);
  const loading =
    !walletsReady ||
    Boolean(
      hasAddress && !missingApiKey && !settled && visibleTokens.length === 0,
    );

  const totalUsd = visibleTokens.reduce<number | null>((sum, token) => {
    if (token.usdValue == null) {
      return sum;
    }
    return (sum ?? 0) + token.usdValue;
  }, null);

  const refresh = useCallback(() => {
    const nextReloadKey = reloadKey + 1;
    setRefreshFetchId(makeFetchId(key, nextReloadKey));
    setReloadKey(nextReloadKey);
  }, [key, reloadKey]);

  const poll = useCallback(() => {
    // Expire the shared cache so the next fetch isn't skipped, without
    // marking this as a user-driven refresh (no spinner).
    if (tokenBalancesCache?.key === key) {
      tokenBalancesCache = {
        ...tokenBalancesCache,
        fetchedAt: 0,
      };
    }
    setReloadKey((current) => current + 1);
  }, [key]);

  return {
    ready: walletsReady,
    ethereumAddress,
    solanaAddress,
    tokens: visibleTokens,
    totalUsd,
    loading,
    refreshing,
    error: visibleError,
    refresh,
    poll,
  };
}
