import { fetchPendingNonce } from '@/lib/send/evmNonce';
import { getAlchemyRpcUrl } from '@/lib/send/rpc';

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string };
};

const POLL_MS = 600;
const DEFAULT_TIMEOUT_MS = 90_000;

async function fetchLatestNonce(
  network: string,
  address: string,
): Promise<bigint> {
  const response = await fetch(getAlchemyRpcUrl(network), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionCount',
      params: [address, 'latest'],
    }),
  });
  if (!response.ok) {
    throw new Error(
      `eth_getTransactionCount(latest) failed (HTTP ${response.status})`,
    );
  }
  const json = (await response.json()) as JsonRpcResponse;
  if (json.error || typeof json.result !== 'string') {
    throw new Error(
      json.error?.message ??
        'eth_getTransactionCount(latest) returned invalid result',
    );
  }
  return BigInt(json.result);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Waits until no EVM tx is pending for `address` on `network`.
 * Delegated (EIP-7702) accounts on Base reject a second in-flight tx.
 */
export async function waitForEvmSendSlot(
  network: string,
  address: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const [pending, latest] = await Promise.all([
      fetchPendingNonce(network, address),
      fetchLatestNonce(network, address),
    ]);
    if (pending <= latest) {
      return;
    }
    await sleep(POLL_MS);
  }

  throw new Error(
    `Timed out waiting for a free send slot on ${network}. A previous transfer may still be confirming.`,
  );
}
