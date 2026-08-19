import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const requestIdRef = useRef(0);
  const apiKey = getAlchemyApiKey();

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!address?.trim() || !apiKey) {
      setResult(null);
      setLoading(false);
      setErrorMessage(
        apiKey ? null : 'Missing EXPO_PUBLIC_ALCHEMY_API_KEY',
      );
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const trimmed = address.trim();

    setLoading(true);
    setErrorMessage(null);

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
        setErrorMessage(message);
      } finally {
        if (requestId === requestIdRef.current && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [address, apiKey, chain, refreshToken]);

  return {
    result,
    loading,
    errorMessage,
    refresh,
  };
}
