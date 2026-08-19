import { fetchErc20Balance } from '@/lib/send/fetchErc20Balance';

const POLL_MS = 600;
const DEFAULT_TIMEOUT_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Polls until `holder` has at least `minRaw` of `tokenAddress` on `network`.
 * Covers RPC/indexer lag after a vault withdraw or transfer receipt.
 */
export async function waitForErc20Balance(params: {
  network: string;
  tokenAddress: string;
  holder: string;
  minRaw: bigint;
  timeoutMs?: number;
}): Promise<bigint> {
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const balance = await fetchErc20Balance({
      network: params.network,
      tokenAddress: params.tokenAddress,
      holder: params.holder,
    });
    if (balance >= params.minRaw) {
      return balance;
    }
    await sleep(POLL_MS);
  }

  throw new Error(
    `Timed out waiting for ERC-20 balance on ${params.network} (need ${params.minRaw.toString()} raw).`,
  );
}

/**
 * Polls until `holder` has at most `maxRaw` of `tokenAddress` on `network`.
 * Covers RPC/indexer lag after a send receipt.
 */
export async function waitForErc20BalanceAtMost(params: {
  network: string;
  tokenAddress: string;
  holder: string;
  maxRaw: bigint;
  timeoutMs?: number;
}): Promise<bigint> {
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const balance = await fetchErc20Balance({
      network: params.network,
      tokenAddress: params.tokenAddress,
      holder: params.holder,
    });
    if (balance <= params.maxRaw) {
      return balance;
    }
    await sleep(POLL_MS);
  }

  throw new Error(
    `Timed out waiting for ERC-20 balance on ${params.network} to drop to ${params.maxRaw.toString()} raw.`,
  );
}
