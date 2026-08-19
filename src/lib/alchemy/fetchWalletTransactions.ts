import { getAlchemyApiKey } from '@/lib/alchemy/alchemyCredentials';
import {
  ALCHEMY_EVM_NETWORKS,
  getNetworkLabel,
  type AlchemyEvmNetwork,
} from '@/lib/alchemy/networks';
import { getAlchemyRpcUrl, getSolanaRpcUrl } from '@/lib/send/rpc';

export type WalletTransaction = {
  id: string;
  /** Unix ms. */
  timestampMs: number;
  /** Positive USD ≈ inflow, negative ≈ outflow (current prices, approximate). */
  usdDelta: number | null;
  /** Signed token units transferred (positive in, negative out). */
  tokenAmount: number;
  /** Token symbol for fallback display when fiat is unknown. */
  tokenSymbol: string;
  /** Counterparty address(es) — recipient on sends, sender on receives. */
  recipients: string[];
  network: string;
  networkLabel: string;
  hash: string;
};

type JsonRpcResponse<T> = {
  result?: T;
  error?: { message?: string };
};

type AlchemyTransfer = {
  uniqueId?: string;
  hash?: string;
  from?: string | null;
  to?: string | null;
  value?: number | null;
  asset?: string | null;
  category?: string;
  metadata?: { blockTimestamp?: string } | null;
};

type AlchemyTransfersResult = {
  transfers?: AlchemyTransfer[];
};

type SolanaSignature = {
  signature: string;
  blockTime?: number | null;
  err?: unknown;
};

type SolanaTokenBalance = {
  accountIndex?: number;
  mint?: string;
  owner?: string;
  uiTokenAmount?: {
    uiAmount?: number | null;
    amount?: string;
    decimals?: number;
  };
};

type SolanaTransaction = {
  blockTime?: number | null;
  meta?: {
    err?: unknown;
    preBalances?: number[];
    postBalances?: number[];
    preTokenBalances?: SolanaTokenBalance[] | null;
    postTokenBalances?: SolanaTokenBalance[] | null;
  } | null;
  transaction?: {
    message?: {
      accountKeys?: (string | { pubkey?: string })[];
    };
  } | null;
};

/** Only native + ERC-20 value transfers (no internal/NFT noise). */
function transferCategories(_network: AlchemyEvmNetwork): string[] {
  return ['external', 'erc20'];
}

const MAX_TRANSFERS_PER_QUERY = '0x19'; // 25
const SOLANA_SIGNATURE_LIMIT = 40;
/** Ignore SOL deltas that are just fees / dust (not a real transfer). */
const MIN_SOL_TRANSFER_LAMPORTS = 100_000n; // 0.0001 SOL

const STABLE_SYMBOLS = new Set([
  'usdc',
  'usdt',
  'dai',
  'usdbc',
  'usd1',
  'usde',
  'pyusd',
]);

const SOLANA_MINT_SYMBOLS: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  So11111111111111111111111111111111111111112: 'SOL',
};

function signedTokenAmount(value: number, direction: 'in' | 'out'): number {
  const absolute = Math.abs(value);
  return direction === 'in' ? absolute : -absolute;
}

function shortenMintSymbol(mint: string): string {
  if (mint.length <= 10) {
    return mint;
  }
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

async function rpcCall<T>(
  url: string,
  method: string,
  params: unknown[],
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed (HTTP ${response.status})`);
  }
  const json = (await response.json()) as JsonRpcResponse<T>;
  if (json.error) {
    throw new Error(json.error.message ?? `RPC ${method} failed`);
  }
  if (json.result === undefined) {
    throw new Error(`RPC ${method} returned no result`);
  }
  return json.result;
}

function addressesEqual(a: string | null | undefined, b: string): boolean {
  return Boolean(a && a.toLowerCase() === b.toLowerCase());
}

function parseTimestampMs(iso: string | null | undefined): number | null {
  if (!iso) {
    return null;
  }
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

async function fetchUsdPriceBySymbol(
  apiKey: string,
  symbols: string[],
  signal?: AbortSignal,
): Promise<Map<string, number>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))].filter(
    Boolean,
  );
  const prices = new Map<string, number>();
  if (unique.length === 0) {
    return prices;
  }

  try {
    const response = await fetch(
      `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-symbol?${unique
        .map((symbol) => `symbols=${encodeURIComponent(symbol)}`)
        .join('&')}`,
      { signal },
    );
    if (!response.ok) {
      return prices;
    }
    const json = (await response.json()) as {
      data?: {
        symbol?: string;
        prices?: { currency?: string; value?: string }[];
      }[];
    };
    for (const row of json.data ?? []) {
      const symbol = row.symbol?.toUpperCase();
      const usd = row.prices?.find(
        (price) => price.currency?.toLowerCase() === 'usd',
      )?.value;
      if (!symbol || !usd) {
        continue;
      }
      const value = Number(usd);
      if (Number.isFinite(value) && value > 0) {
        prices.set(symbol, value);
      }
    }
  } catch {
    // Keep empty map; fiat may be unavailable for some rows.
  }

  return prices;
}

function estimateUsdDelta(options: {
  asset: string | null | undefined;
  value: number | null | undefined;
  direction: 'in' | 'out';
  prices: Map<string, number>;
}): number | null {
  const { asset, value, direction, prices } = options;
  if (value == null || !Number.isFinite(value) || value === 0) {
    return null;
  }
  const symbol = (asset ?? '').trim().toUpperCase();
  if (!symbol) {
    return null;
  }

  let unitPrice: number | null = null;
  if (STABLE_SYMBOLS.has(symbol.toLowerCase())) {
    unitPrice = 1;
  } else {
    unitPrice = prices.get(symbol) ?? null;
  }
  if (unitPrice == null) {
    return null;
  }

  const usd = value * unitPrice;
  if (!Number.isFinite(usd)) {
    return null;
  }
  return direction === 'in' ? usd : -usd;
}

async function fetchEvmNetworkTransfers(options: {
  network: AlchemyEvmNetwork;
  address: string;
  prices: Map<string, number>;
  signal?: AbortSignal;
}): Promise<WalletTransaction[]> {
  const { network, address, prices, signal } = options;
  const url = getAlchemyRpcUrl(network);
  const category = transferCategories(network);
  const baseParams = {
    fromBlock: '0x0',
    toBlock: 'latest',
    excludeZeroValue: true,
    withMetadata: true,
    category,
    order: 'desc',
    maxCount: MAX_TRANSFERS_PER_QUERY,
  };

  const [outgoing, incoming] = await Promise.all([
    rpcCall<AlchemyTransfersResult>(
      url,
      'alchemy_getAssetTransfers',
      [{ ...baseParams, fromAddress: address }],
      signal,
    ),
    rpcCall<AlchemyTransfersResult>(
      url,
      'alchemy_getAssetTransfers',
      [{ ...baseParams, toAddress: address }],
      signal,
    ),
  ]);

  const byId = new Map<string, WalletTransaction>();
  const networkLabel = getNetworkLabel(network);

  const ingest = (transfer: AlchemyTransfer, direction: 'in' | 'out') => {
    if (
      transfer.category !== 'external' &&
      transfer.category !== 'erc20'
    ) {
      return;
    }
    if (transfer.value == null || !(transfer.value > 0)) {
      return;
    }
    const timestampMs = parseTimestampMs(transfer.metadata?.blockTimestamp);
    if (timestampMs == null || !transfer.hash) {
      return;
    }

    const recipients =
      direction === 'out'
        ? transfer.to
          ? [transfer.to]
          : []
        : transfer.from
          ? [transfer.from]
          : [];
    // Require a counterparty — skips contract creates / malformed rows.
    if (recipients.length === 0) {
      return;
    }

    const id = `${network}:${transfer.uniqueId ?? transfer.hash}:${direction}`;
    if (byId.has(id)) {
      return;
    }

    const symbol = (transfer.asset ?? 'TOKEN').trim() || 'TOKEN';
    const tokenAmount = signedTokenAmount(transfer.value, direction);

    byId.set(id, {
      id,
      timestampMs,
      usdDelta: estimateUsdDelta({
        asset: transfer.asset,
        value: transfer.value,
        direction,
        prices,
      }),
      tokenAmount,
      tokenSymbol: symbol,
      recipients,
      network,
      networkLabel,
      hash: transfer.hash,
    });
  };

  for (const transfer of outgoing.transfers ?? []) {
    if (addressesEqual(transfer.from, address)) {
      ingest(transfer, 'out');
    }
  }
  for (const transfer of incoming.transfers ?? []) {
    if (addressesEqual(transfer.to, address)) {
      ingest(transfer, 'in');
    }
  }

  return [...byId.values()];
}

function solanaAccountKey(
  key: string | { pubkey?: string } | undefined,
): string | null {
  if (typeof key === 'string') {
    return key;
  }
  return key?.pubkey ?? null;
}

function tokenUiAmount(entry: SolanaTokenBalance | undefined): number {
  const ui = entry?.uiTokenAmount?.uiAmount;
  if (ui != null && Number.isFinite(ui)) {
    return ui;
  }
  const raw = entry?.uiTokenAmount?.amount;
  const decimals = entry?.uiTokenAmount?.decimals ?? 0;
  if (!raw || !/^\d+$/.test(raw)) {
    return 0;
  }
  return Number(raw) / 10 ** decimals;
}

function ownerTokenAmount(
  balances: SolanaTokenBalance[] | null | undefined,
  owner: string,
  mint: string,
): number {
  let total = 0;
  for (const entry of balances ?? []) {
    if (entry.owner === owner && entry.mint === mint) {
      total += tokenUiAmount(entry);
    }
  }
  return total;
}

/**
 * Builds activity from SPL token balance changes and native SOL transfers only
 * (ignores fee-only / rent-only SOL movements).
 */
async function fetchSolanaTransfers(options: {
  address: string;
  prices: Map<string, number>;
  signal?: AbortSignal;
}): Promise<WalletTransaction[]> {
  const { address, prices, signal } = options;
  const url = getSolanaRpcUrl();

  const signatures = await rpcCall<SolanaSignature[]>(
    url,
    'getSignaturesForAddress',
    [address, { limit: SOLANA_SIGNATURE_LIMIT }],
    signal,
  );

  const solPrice = prices.get('SOL') ?? null;
  const results: WalletTransaction[] = [];

  await Promise.all(
    signatures.map(async (entry) => {
      if (entry.err != null) {
        return;
      }
      try {
        const tx = await rpcCall<SolanaTransaction | null>(
          url,
          'getTransaction',
          [
            entry.signature,
            {
              encoding: 'jsonParsed',
              maxSupportedTransactionVersion: 0,
            },
          ],
          signal,
        );
        if (!tx?.meta || tx.meta.err != null) {
          return;
        }

        const timestampMs =
          (tx.blockTime ?? entry.blockTime) != null
            ? (tx.blockTime ?? entry.blockTime)! * 1000
            : null;
        if (timestampMs == null) {
          return;
        }

        const network = 'solana-mainnet';
        const networkLabel = getNetworkLabel(network);
        const preToken = tx.meta.preTokenBalances ?? [];
        const postToken = tx.meta.postTokenBalances ?? [];
        const mints = new Set<string>();
        for (const row of [...preToken, ...postToken]) {
          if (row.mint && row.owner === address) {
            mints.add(row.mint);
          }
        }

        let addedSpl = false;
        for (const mint of mints) {
          const before = ownerTokenAmount(preToken, address, mint);
          const after = ownerTokenAmount(postToken, address, mint);
          const delta = after - before;
          if (!(Math.abs(delta) > 0)) {
            continue;
          }

          const direction: 'in' | 'out' = delta > 0 ? 'in' : 'out';
          const recipients: string[] = [];
          const owners = new Set<string>();
          for (const row of [...preToken, ...postToken]) {
            if (row.mint === mint && row.owner && row.owner !== address) {
              owners.add(row.owner);
            }
          }
          for (const owner of owners) {
            const otherDelta =
              ownerTokenAmount(postToken, owner, mint) -
              ownerTokenAmount(preToken, owner, mint);
            if (direction === 'out' && otherDelta > 0) {
              recipients.push(owner);
            } else if (direction === 'in' && otherDelta < 0) {
              recipients.push(owner);
            }
          }
          if (recipients.length === 0) {
            continue;
          }

          const symbol =
            SOLANA_MINT_SYMBOLS[mint] ?? shortenMintSymbol(mint);
          const tokenAmount = signedTokenAmount(delta, direction);
          const usdDelta = estimateUsdDelta({
            asset: symbol,
            value: Math.abs(delta),
            direction,
            prices,
          });

          results.push({
            id: `solana-mainnet:${entry.signature}:spl:${mint}`,
            timestampMs,
            usdDelta,
            tokenAmount,
            tokenSymbol: symbol,
            recipients: recipients.slice(0, 3),
            network,
            networkLabel,
            hash: entry.signature,
          });
          addedSpl = true;
        }

        if (addedSpl) {
          return;
        }

        // Native SOL transfer (not fee-only): another account gained/lost SOL.
        const keys = tx.transaction?.message?.accountKeys ?? [];
        const index = keys.findIndex(
          (key) => solanaAccountKey(key) === address,
        );
        if (index < 0) {
          return;
        }
        const pre = tx.meta.preBalances?.[index];
        const post = tx.meta.postBalances?.[index];
        if (pre == null || post == null) {
          return;
        }
        const lamportsDelta = BigInt(post - pre);
        if (
          lamportsDelta === 0n ||
          (lamportsDelta < 0n
            ? -lamportsDelta
            : lamportsDelta) < MIN_SOL_TRANSFER_LAMPORTS
        ) {
          return;
        }

        const recipients: string[] = [];
        const preBalances = tx.meta.preBalances ?? [];
        const postBalances = tx.meta.postBalances ?? [];
        for (let i = 0; i < keys.length; i++) {
          if (i === index) {
            continue;
          }
          const key = solanaAccountKey(keys[i]);
          if (!key) {
            continue;
          }
          const otherPre = preBalances[i];
          const otherPost = postBalances[i];
          if (otherPre == null || otherPost == null) {
            continue;
          }
          const otherDelta = BigInt(otherPost - otherPre);
          if (lamportsDelta < 0n && otherDelta > MIN_SOL_TRANSFER_LAMPORTS) {
            recipients.push(key);
          } else if (
            lamportsDelta > 0n &&
            -otherDelta > MIN_SOL_TRANSFER_LAMPORTS
          ) {
            recipients.push(key);
          }
        }
        if (recipients.length === 0) {
          return;
        }

        const solDelta = Number(lamportsDelta) / 1_000_000_000;
        const direction: 'in' | 'out' = solDelta > 0 ? 'in' : 'out';
        results.push({
          id: `solana-mainnet:${entry.signature}:sol`,
          timestampMs,
          usdDelta:
            solPrice != null && Number.isFinite(solDelta)
              ? solDelta * solPrice
              : null,
          tokenAmount: signedTokenAmount(solDelta, direction),
          tokenSymbol: 'SOL',
          recipients: recipients.slice(0, 3),
          network,
          networkLabel,
          hash: entry.signature,
        });
      } catch {
        // Skip failed lookups.
      }
    }),
  );

  return results;
}

/**
 * Loads recent transfers for the user's EVM + Solana wallets and estimates
 * fiat deltas with current token prices (good enough for a simple activity list).
 */
export async function fetchWalletTransactions(options: {
  ethereumAddress: string | null;
  solanaAddress: string | null;
  signal?: AbortSignal;
}): Promise<WalletTransaction[]> {
  const apiKey = getAlchemyApiKey();
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_ALCHEMY_API_KEY');
  }

  const { ethereumAddress, solanaAddress, signal } = options;
  if (!ethereumAddress && !solanaAddress) {
    return [];
  }

  const prices = await fetchUsdPriceBySymbol(
    apiKey,
    ['ETH', 'WETH', 'AVAX', 'SOL', 'POL', 'MATIC'],
    signal,
  );

  const errors: string[] = [];
  const batches: WalletTransaction[][] = [];

  if (ethereumAddress) {
    const evmResults = await Promise.allSettled(
      ALCHEMY_EVM_NETWORKS.map((network) =>
        fetchEvmNetworkTransfers({
          network,
          address: ethereumAddress,
          prices,
          signal,
        }),
      ),
    );
    for (const result of evmResults) {
      if (result.status === 'fulfilled') {
        batches.push(result.value);
      } else {
        errors.push(
          result.reason instanceof Error
            ? result.reason.message
            : 'Failed to load transactions',
        );
      }
    }
  }

  if (solanaAddress) {
    try {
      batches.push(
        await fetchSolanaTransfers({
          address: solanaAddress,
          prices,
          signal,
        }),
      );
    } catch (err) {
      errors.push(
        err instanceof Error ? err.message : 'Failed to load transactions',
      );
    }
  }

  const transactions = batches
    .flat()
    .sort((a, b) => b.timestampMs - a.timestampMs);

  if (transactions.length === 0 && errors.length > 0) {
    throw new Error(errors[0] ?? 'Failed to load transactions');
  }

  return transactions;
}
