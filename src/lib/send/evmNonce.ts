import { getAlchemyRpcUrl, toHexQuantity } from '@/lib/send/rpc';

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string };
};

async function rpcCall(
  network: string,
  method: string,
  params: unknown[],
): Promise<string> {
  const response = await fetch(getAlchemyRpcUrl(network), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed (HTTP ${response.status})`);
  }
  const json = (await response.json()) as JsonRpcResponse;
  if (json.error || typeof json.result !== 'string') {
    throw new Error(
      json.error?.message ?? `RPC ${method} returned invalid result`,
    );
  }
  return json.result;
}

/** Next nonce including mempool txs (`pending` tag). */
export async function fetchPendingNonce(
  network: string,
  address: string,
): Promise<bigint> {
  const hex = await rpcCall(network, 'eth_getTransactionCount', [
    address,
    'pending',
  ]);
  return BigInt(hex);
}

/**
 * Allocates sequential nonces per EVM network for a payment batch.
 * Starts from `eth_getTransactionCount(..., 'pending')` so orphaned mempool
 * txs from earlier failed attempts don't collide.
 */
export function createEvmNonceAllocator(fromAddress: string) {
  const nextByNetwork = new Map<string, bigint>();

  return {
    /** Drop cached nonce so the next `take` re-reads `pending` from RPC. */
    invalidate(network: string): void {
      nextByNetwork.delete(network);
    },

    async take(network: string): Promise<`0x${string}`> {
      let next = nextByNetwork.get(network);
      if (next == null) {
        next = await fetchPendingNonce(network, fromAddress);
      }
      nextByNetwork.set(network, next + 1n);
      return toHexQuantity(next);
    },
  };
}

export type EvmNonceAllocator = ReturnType<typeof createEvmNonceAllocator>;
