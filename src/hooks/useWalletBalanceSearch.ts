import { useEffect, useMemo, useRef, useState } from 'react';

import { formatRawTokenBalance, formatUsdValue, type OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { getAlchemyApiKey } from '@/lib/alchemy/alchemyCredentials';
import { fetchTokensByAddress } from '@/lib/alchemy/fetchTokensByAddress';
import {
  ALCHEMY_EVM_NETWORKS,
  ALCHEMY_SOLANA_NETWORKS,
} from '@/lib/alchemy/networks';
import { isValidEvmAddress, isValidSolanaAddress } from '@/lib/validation';

export type WalletBalanceLine = {
  network: string;
  networkLabel: string;
  symbol: string;
  balanceLabel: string;
  usdLabel: string | null;
  usdValue: number | null;
};

export type WalletBalanceSearchHit = {
  address: string;
  chain: 'ethereum' | 'solana';
  balances: WalletBalanceLine[];
  totalUsdLabel: string | null;
};

const DEBOUNCE_MS = 400;

function toBalanceLine(token: OwnedToken): WalletBalanceLine {
  return {
    network: token.network,
    networkLabel: token.networkLabel,
    symbol: token.symbol,
    balanceLabel: `${formatRawTokenBalance(token.rawBalance, token.decimals, 2)} ${token.symbol}`,
    usdLabel: formatUsdValue(token.usdValue),
    usdValue: token.usdValue,
  };
}

/**
 * Debounced wallet search that resolves portfolio balances for a valid address.
 */
export function useWalletBalanceSearch(query: string) {
  const [result, setResult] = useState<WalletBalanceSearchHit | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState('');
  const requestIdRef = useRef(0);

  const trimmed = query.trim();
  const isEvm = isValidEvmAddress(trimmed);
  const isSolana = isValidSolanaAddress(trimmed);
  const chain: 'ethereum' | 'solana' | null = isEvm
    ? 'ethereum'
    : isSolana
      ? 'solana'
      : null;
  const apiKey = getAlchemyApiKey();

  useEffect(() => {
    if (!chain || !apiKey) {
      requestIdRef.current += 1;
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setIsSearching(true);
      setErrorMessage(null);

      void (async () => {
        try {
          const tokens = await fetchTokensByAddress({
            apiKey,
            queries: [
              {
                address: trimmed,
                networks:
                  chain === 'ethereum'
                    ? ALCHEMY_EVM_NETWORKS
                    : ALCHEMY_SOLANA_NETWORKS,
              },
            ],
            signal: controller.signal,
          });
          if (requestId !== requestIdRef.current || controller.signal.aborted) {
            return;
          }

          const balances = tokens
            .map(toBalanceLine)
            .sort((a, b) => (b.usdValue ?? -1) - (a.usdValue ?? -1))
            .slice(0, 5);

          const totalUsd = tokens.reduce<number | null>((sum, token) => {
            if (token.usdValue == null) {
              return sum;
            }
            return (sum ?? 0) + token.usdValue;
          }, null);

          setResult({
            address: trimmed,
            chain,
            balances,
            totalUsdLabel: formatUsdValue(totalUsd),
          });
          setResolvedQuery(trimmed);
          setErrorMessage(null);
        } catch (error) {
          if (requestId !== requestIdRef.current || controller.signal.aborted) {
            return;
          }
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to load wallet balances';
          setResult(null);
          setResolvedQuery(trimmed);
          setErrorMessage(message);
        } finally {
          if (requestId === requestIdRef.current && !controller.signal.aborted) {
            setIsSearching(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [apiKey, chain, trimmed]);

  const visibleResult = useMemo(() => {
    if (!chain || resolvedQuery !== trimmed) {
      return null;
    }
    return result;
  }, [chain, resolvedQuery, result, trimmed]);

  const visibleError = useMemo(() => {
    if (!trimmed) {
      return null;
    }
    if (!chain) {
      return 'Enter a valid EVM or Solana address.';
    }
    if (!apiKey) {
      return 'Missing EXPO_PUBLIC_ALCHEMY_API_KEY';
    }
    if (resolvedQuery === trimmed) {
      return errorMessage;
    }
    return null;
  }, [apiKey, chain, errorMessage, resolvedQuery, trimmed]);

  const showEmpty =
    Boolean(chain) &&
    !isSearching &&
    resolvedQuery === trimmed &&
    visibleResult != null &&
    visibleResult.balances.length === 0 &&
    !visibleError;

  return {
    result: visibleResult,
    isSearching: Boolean(chain) && isSearching,
    showEmpty,
    errorMessage: visibleError,
  };
}
