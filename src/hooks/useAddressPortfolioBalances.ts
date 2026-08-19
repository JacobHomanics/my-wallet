import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchTokensByAddressAllNetworks,
  formatRawTokenBalance,
  formatUsdValue,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getAlchemyApiKey } from '@/lib/alchemy/alchemyCredentials';
import {
  ALCHEMY_EVM_NETWORKS,
  ALCHEMY_SOLANA_NETWORKS,
} from '@/lib/alchemy/networks';

export type AddressBalanceLine = {
  network: string;
  networkLabel: string;
  symbol: string;
  balanceLabel: string;
  usdLabel: string | null;
  usdValue: number | null;
};

export type AddressPortfolioBalances = {
  address: string;
  chain: 'ethereum' | 'solana';
  lines: AddressBalanceLine[];
  totalUsdLabel: string | null;
};

function toBalanceLine(token: OwnedToken): AddressBalanceLine {
  return {
    network: token.network,
    networkLabel: token.networkLabel,
    symbol: token.symbol,
    balanceLabel: `${formatRawTokenBalance(token.rawBalance, token.decimals, 2)} ${token.symbol}`,
    usdLabel: formatUsdValue(token.usdValue),
    usdValue: token.usdValue,
  };
}

function summarizeTokens(
  address: string,
  chain: 'ethereum' | 'solana',
  tokens: OwnedToken[],
): AddressPortfolioBalances {
  const lines = tokens
    .map(toBalanceLine)
    .sort((a, b) => (b.usdValue ?? -1) - (a.usdValue ?? -1));

  const totalUsd = tokens.reduce<number | null>((sum, token) => {
    if (token.usdValue == null) {
      return sum;
    }
    return (sum ?? 0) + token.usdValue;
  }, null);

  return {
    address,
    chain,
    lines,
    totalUsdLabel: formatUsdValue(totalUsd),
  };
}

/**
 * Loads portfolio balances for a fixed wallet address (no search debounce).
 */
export function useAddressPortfolioBalances(
  address: string | null | undefined,
  chain: 'ethereum' | 'solana',
) {
  const [result, setResult] = useState<AddressPortfolioBalances | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvedChain, setResolvedChain] = useState<
    'ethereum' | 'solana' | null
  >(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const requestIdRef = useRef(0);
  const apiKey = getAlchemyApiKey();
  const trimmed = address?.trim() ?? '';
  const canFetch = Boolean(trimmed && apiKey);

  const refresh = useCallback(() => {
    setResolvedAddress('');
    setResolvedChain(null);
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!canFetch) {
      requestIdRef.current += 1;
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    void (async () => {
      try {
        const tokens = await fetchTokensByAddressAllNetworks({
          apiKey,
          address: trimmed,
          networks:
            chain === 'ethereum'
              ? ALCHEMY_EVM_NETWORKS
              : ALCHEMY_SOLANA_NETWORKS,
          signal: controller.signal,
        });
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }

        setResult(summarizeTokens(trimmed, chain, tokens));
        setResolvedAddress(trimmed);
        setResolvedChain(chain);
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
        setResolvedAddress(trimmed);
        setResolvedChain(chain);
        setErrorMessage(message);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [canFetch, trimmed, chain, apiKey, refreshToken]);

  const visibleResult = useMemo(() => {
    if (!canFetch || resolvedAddress !== trimmed || resolvedChain !== chain) {
      return null;
    }
    return result;
  }, [canFetch, resolvedAddress, trimmed, resolvedChain, chain, result]);

  const visibleError = useMemo(() => {
    if (!apiKey) {
      return 'Missing EXPO_PUBLIC_ALCHEMY_API_KEY';
    }
    if (!trimmed) {
      return null;
    }
    if (resolvedAddress === trimmed && resolvedChain === chain) {
      return errorMessage;
    }
    return null;
  }, [apiKey, trimmed, resolvedAddress, resolvedChain, chain, errorMessage]);

  const loading =
    canFetch &&
    (resolvedAddress !== trimmed || resolvedChain !== chain);

  return {
    result: visibleResult,
    loading,
    errorMessage: visibleError,
    refresh,
  };
}
