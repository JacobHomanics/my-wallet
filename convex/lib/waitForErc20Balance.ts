import { fetchErc20Balance } from "./fetchErc20Balance";

const POLL_MS = 600;
const DEFAULT_TIMEOUT_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Polls until `holder` has at least `minRaw` of `tokenAddress` on `network`.
 * Covers RPC/indexer lag after a transfer receipt is already available.
 */
export async function waitForErc20Balance(params: {
  network: string;
  tokenAddress: string;
  holder: string;
  minRaw: bigint;
  timeoutMs?: number;
}): Promise<void> {
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const balance = await fetchErc20Balance({
      network: params.network,
      tokenAddress: params.tokenAddress,
      holder: params.holder,
    });
    if (balance >= params.minRaw) {
      return;
    }
    await sleep(POLL_MS);
  }

  throw new Error(
    `Timed out waiting for ERC-20 balance on ${params.network} (need ${params.minRaw.toString()} raw).`,
  );
}
