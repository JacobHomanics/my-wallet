import { useEffect, useRef, useState } from 'react';

import { useUserWallets } from '@/hooks/useUserWallets';
import { getAlchemyApiKey } from '@/lib/alchemy/alchemyCredentials';
import {
  fetchTokensByAddress,
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
};

const CACHE_TTL_MS = 60_000;

type TokenBalancesCache = {
  key: string;
  tokens: OwnedToken[];
  error: string | null;
  fetchedAt: number;
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

/**
 * Loads fungible token balances for Privy Ethereum + Solana addresses via Alchemy.
 */
export function useTokenBalances(): TokenBalancesResult {
  const { ready: walletsReady, wallets } = useUserWallets();
  const ethereumAddress =
    wallets.find((wallet) => wallet.chain === 'ethereum')?.address ?? null;
  const solanaAddress =
    wallets.find((wallet) => wallet.chain === 'solana')?.address ?? null;
  const hasAddress = Boolean(ethereumAddress || solanaAddress);
  const key = cacheKey(ethereumAddress, solanaAddress);
  const cached = hasAddress ? readFreshCache(key) : null;

  const [tokens, setTokens] = useState<OwnedToken[]>(
    () => cached?.tokens ?? [],
  );
  const [loading, setLoading] = useState(() => !cached && hasAddress);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(
    () => cached?.error ?? null,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const pullRefreshRef = useRef(false);

  useEffect(() => {
    if (!walletsReady) {
      return;
    }

    if (!hasAddress) {
      setTokens([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const apiKey = getAlchemyApiKey();
    if (!apiKey) {
      setTokens([]);
      setError('Missing EXPO_PUBLIC_ALCHEMY_API_KEY');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const isPullRefresh = pullRefreshRef.current;
    pullRefreshRef.current = false;

    if (!isPullRefresh) {
      const fresh = readFreshCache(key);
      if (fresh) {
        setTokens(fresh.tokens);
        setError(fresh.error);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }

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

    const controller = new AbortController();

    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    void (async () => {
      try {
        // Fetch EVM and Solana separately so one chain failure does not wipe the other.
        const results = await Promise.allSettled(
          queries.map((query) =>
            fetchTokensByAddress({
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

        sortOwnedTokens(nextTokens);
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

        setTokens(nextTokens);
        setError(nextError);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        if (!isPullRefresh) {
          setTokens([]);
        }
        setError(err instanceof Error ? err.message : 'Failed to load tokens');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    ethereumAddress,
    solanaAddress,
    hasAddress,
    walletsReady,
    reloadKey,
    key,
  ]);

  const totalUsd = tokens.reduce<number | null>((sum, token) => {
    if (token.usdValue == null) {
      return sum;
    }
    return (sum ?? 0) + token.usdValue;
  }, null);

  return {
    ready: walletsReady,
    ethereumAddress,
    solanaAddress,
    tokens,
    totalUsd,
    loading: !walletsReady || Boolean(hasAddress && loading && tokens.length === 0),
    refreshing,
    error,
    refresh: () => {
      pullRefreshRef.current = true;
      setReloadKey((prev) => prev + 1);
    },
  };
}
