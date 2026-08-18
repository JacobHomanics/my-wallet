import { getAlchemyRpcUrl, toHexQuantity } from "./networks";

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string };
};

const POLL_MS = 600;
const DEFAULT_TIMEOUT_MS = 90_000;

async function rpcCall(
  network: string,
  method: string,
  params: unknown[],
): Promise<string> {
  const response = await fetch(getAlchemyRpcUrl(network), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed (HTTP ${response.status})`);
  }
  const json = (await response.json()) as JsonRpcResponse;
  if (json.error || typeof json.result !== "string") {
    throw new Error(
      json.error?.message ?? `RPC ${method} returned invalid result`,
    );
  }
  return json.result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchPendingNonce(
  network: string,
  address: string,
): Promise<bigint> {
  return BigInt(
    await rpcCall(network, "eth_getTransactionCount", [address, "pending"]),
  );
}

async function fetchLatestNonce(
  network: string,
  address: string,
): Promise<bigint> {
  return BigInt(
    await rpcCall(network, "eth_getTransactionCount", [address, "latest"]),
  );
}

/** Waits until no pending EVM tx occupies the delegated-account in-flight slot. */
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
