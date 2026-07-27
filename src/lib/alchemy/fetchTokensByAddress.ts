import {
  getDefaultTokenDecimals,
  getNativeTokenFallback,
  getNetworkLabel,
  getNetworkSortIndex,
} from '@/lib/alchemy/networks';
import {
  isNativeTokenAddress,
  resolveTokenLogoUrl,
} from '@/lib/alchemy/tokenLogos';

export type OwnedToken = {
  id: string;
  network: string;
  networkLabel: string;
  tokenAddress: string | null;
  symbol: string;
  name: string;
  decimals: number;
  rawBalance: bigint;
  balanceFormatted: string;
  usdValue: number | null;
  logoUrl: string | null;
};

export type WalletNetworksQuery = {
  address: string;
  networks: readonly string[];
};

type AlchemyTokenPrice = {
  currency?: string;
  value?: string;
};

type AlchemyTokenMetadata = {
  name?: string | null;
  symbol?: string | null;
  decimals?: number | null;
  logo?: string | null;
};

type AlchemyTokenRow = {
  network?: string;
  address?: string;
  tokenAddress?: string | null;
  tokenBalance?: string | null;
  tokenMetadata?: AlchemyTokenMetadata | null;
  tokenPrices?: AlchemyTokenPrice[] | null;
};

type AlchemyTokensResponse = {
  data?: {
    tokens?: AlchemyTokenRow[];
    pageKey?: string | null;
  };
  error?: { message?: string };
};

/**
 * Parses Alchemy balances. EVM usually returns hex; Solana may return decimal strings.
 */
function parseTokenBalance(value: string | null | undefined): bigint {
  if (!value || value === '0x' || value === '0x0' || value === '0') {
    return 0n;
  }

  try {
    if (value.startsWith('0x') || value.startsWith('0X')) {
      return BigInt(value);
    }
    if (/^\d+$/.test(value)) {
      return BigInt(value);
    }
    return BigInt(value);
  } catch {
    return 0n;
  }
}

/**
 * Formats a raw token amount for display (trims trailing zeros).
 */
export function formatRawTokenBalance(
  rawBalance: bigint,
  decimals: number,
  maxFractionDigits = 6,
): string {
  if (rawBalance === 0n) {
    return '0';
  }

  const safeDecimals = Math.max(0, Math.min(decimals, 36));
  const negative = rawBalance < 0n;
  const absolute = negative ? -rawBalance : rawBalance;
  const base = 10n ** BigInt(safeDecimals);
  const whole = absolute / base;
  const fraction = absolute % base;

  if (fraction === 0n || maxFractionDigits === 0) {
    return `${negative ? '-' : ''}${whole.toString()}`;
  }

  const fractionDigits = Math.min(maxFractionDigits, safeDecimals);
  const truncated =
    fraction / 10n ** BigInt(Math.max(safeDecimals - fractionDigits, 0));
  const fractionStr = truncated
    .toString()
    .padStart(fractionDigits, '0')
    .replace(/0+$/, '');

  if (!fractionStr) {
    return `${negative ? '-' : ''}${whole.toString()}`;
  }

  return `${negative ? '-' : ''}${whole.toString()}.${fractionStr}`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatUsdValue(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  return formatUsd(value);
}

function usdPrice(prices: AlchemyTokenPrice[] | null | undefined): number | null {
  const usd = prices?.find(
    (price) => price.currency?.toLowerCase() === 'usd' && price.value,
  );
  if (!usd?.value) {
    return null;
  }
  const parsed = Number(usd.value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Converts a raw integer balance to a JS number without blowing past MAX_SAFE_INTEGER. */
function rawBalanceToNumber(rawBalance: bigint, decimals: number): number {
  const safeDecimals = Math.max(0, Math.min(decimals, 36));
  const base = 10n ** BigInt(safeDecimals);
  const whole = rawBalance / base;
  const fraction = rawBalance % base;
  return Number(whole) + Number(fraction) / 10 ** safeDecimals;
}

function toOwnedToken(row: AlchemyTokenRow): OwnedToken | null {
  const network = row.network;
  if (!network) {
    return null;
  }

  const rawBalance = parseTokenBalance(row.tokenBalance);
  if (rawBalance === 0n) {
    return null;
  }

  const isNative = isNativeTokenAddress(row.tokenAddress);
  const nativeFallback = getNativeTokenFallback(network);
  const decimals =
    row.tokenMetadata?.decimals ??
    (isNative ? nativeFallback.decimals : getDefaultTokenDecimals(network));
  const symbol =
    row.tokenMetadata?.symbol?.trim() ||
    (isNative ? nativeFallback.symbol : formatContractSymbol(row.tokenAddress));
  const name =
    row.tokenMetadata?.name?.trim() ||
    (isNative ? nativeFallback.name : symbol);

  const unitPrice = usdPrice(row.tokenPrices);
  const balanceAsNumber = rawBalanceToNumber(rawBalance, decimals);
  const usdValue =
    unitPrice != null && Number.isFinite(balanceAsNumber)
      ? balanceAsNumber * unitPrice
      : null;

  const tokenAddress = isNative ? null : (row.tokenAddress ?? null);

  return {
    id: `${network}:${tokenAddress ?? 'native'}`,
    network,
    networkLabel: getNetworkLabel(network),
    tokenAddress,
    symbol,
    name,
    decimals,
    rawBalance,
    balanceFormatted: formatRawTokenBalance(rawBalance, decimals),
    usdValue,
    logoUrl: resolveTokenLogoUrl({
      network,
      tokenAddress,
      symbol,
      alchemyLogo: row.tokenMetadata?.logo,
    }),
  };
}

function formatContractSymbol(tokenAddress: string | null | undefined) {
  if (!tokenAddress) {
    return 'TOKEN';
  }
  return `${tokenAddress.slice(0, 6)}…`;
}

/** Sort by chain, then USD value (desc), then symbol. */
export function sortOwnedTokens(tokens: OwnedToken[]): OwnedToken[] {
  return tokens.sort((a, b) => {
    const networkDelta =
      getNetworkSortIndex(a.network) - getNetworkSortIndex(b.network);
    if (networkDelta !== 0) {
      return networkDelta;
    }
    const aUsd = a.usdValue ?? -1;
    const bUsd = b.usdValue ?? -1;
    if (bUsd !== aUsd) {
      return bUsd - aUsd;
    }
    return a.symbol.localeCompare(b.symbol);
  });
}

export type TokenChainGroup = {
  network: string;
  networkLabel: string;
  tokens: OwnedToken[];
  totalUsd: number | null;
  /** Present on the Unknown section: unpriced tokens grouped by chain. */
  subgroups?: TokenChainGroup[];
};

export const UNKNOWN_TOKEN_NETWORK = 'unknown';

function groupTokensByNetwork(tokens: OwnedToken[]): TokenChainGroup[] {
  const groups: TokenChainGroup[] = [];

  for (const token of tokens) {
    const last = groups[groups.length - 1];
    if (last && last.network === token.network) {
      last.tokens.push(token);
      if (token.usdValue != null) {
        last.totalUsd = (last.totalUsd ?? 0) + token.usdValue;
      }
      continue;
    }

    groups.push({
      network: token.network,
      networkLabel: token.networkLabel,
      tokens: [token],
      totalUsd: token.usdValue,
    });
  }

  return groups;
}

/** Groups priced tokens by chain; unpriced tokens go in a trailing "Unknown" section. */
export function groupOwnedTokensByChain(
  tokens: OwnedToken[],
): TokenChainGroup[] {
  const priced: OwnedToken[] = [];
  const unknownTokens: OwnedToken[] = [];

  for (const token of tokens) {
    if (token.usdValue == null) {
      unknownTokens.push(token);
    } else {
      priced.push(token);
    }
  }

  const groups = groupTokensByNetwork(priced);

  if (unknownTokens.length > 0) {
    unknownTokens.sort((a, b) => {
      const networkDelta =
        getNetworkSortIndex(a.network) - getNetworkSortIndex(b.network);
      if (networkDelta !== 0) {
        return networkDelta;
      }
      return a.symbol.localeCompare(b.symbol);
    });

    groups.push({
      network: UNKNOWN_TOKEN_NETWORK,
      networkLabel: 'Unknown',
      tokens: unknownTokens,
      totalUsd: null,
      subgroups: groupTokensByNetwork(unknownTokens),
    });
  }

  return groups;
}


export type FetchTokensByAddressParams = {
  apiKey: string;
  /** Up to 2 wallet/network pairs (Alchemy Portfolio API limit). */
  queries: WalletNetworksQuery[];
  signal?: AbortSignal;
};

/**
 * Fetches non-zero fungible balances (native + ERC-20 / SPL) via Alchemy Portfolio API.
 * Paginates until `pageKey` is exhausted.
 */
export async function fetchTokensByAddress({
  apiKey,
  queries,
  signal,
}: FetchTokensByAddressParams): Promise<OwnedToken[]> {
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_ALCHEMY_API_KEY');
  }

  const addresses = queries
    .filter((query) => query.address && query.networks.length > 0)
    .slice(0, 2)
    .map((query) => ({
      address: query.address,
      networks: [...query.networks],
    }));

  if (addresses.length === 0) {
    return [];
  }

  const tokens: OwnedToken[] = [];
  let pageKey: string | undefined;

  do {
    const body: Record<string, unknown> = {
      addresses,
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    };
    if (pageKey) {
      body.pageKey = pageKey;
    }

    const response = await fetch(
      `https://api.g.alchemy.com/data/v1/${apiKey}/assets/tokens/by-address`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Alchemy request failed (${response.status})`);
    }

    const json = (await response.json()) as AlchemyTokensResponse;
    if (json.error?.message) {
      throw new Error(json.error.message);
    }

    for (const row of json.data?.tokens ?? []) {
      const token = toOwnedToken(row);
      if (token) {
        tokens.push(token);
      }
    }

    pageKey = json.data?.pageKey ?? undefined;
  } while (pageKey);

  return sortOwnedTokens(tokens);
}
