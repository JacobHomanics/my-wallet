import { getAlchemyRpcUrl } from "./networks";

type JsonRpcResponse = {
  result?: unknown;
  error?: { message?: string };
};

const POLL_MS = 1_200;
const DEFAULT_TIMEOUT_MS = 120_000;

async function rpcCall(
  network: string,
  method: string,
  params: unknown[],
): Promise<unknown> {
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
  if (json.error) {
    throw new Error(json.error.message ?? `RPC ${method} failed`);
  }
  return json.result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Polls until eth_getTransactionReceipt returns a receipt (or timeout).
 */
export async function waitForEvmReceipt(
  network: string,
  hash: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const receipt = await rpcCall(network, "eth_getTransactionReceipt", [
      hash,
    ]);
    if (receipt != null && typeof receipt === "object") {
      const status = (receipt as { status?: string }).status;
      if (status === "0x0") {
        throw new Error(
          `Transaction reverted on ${network} before the next transfer could be sent.`,
        );
      }
      return;
    }
    await sleep(POLL_MS);
  }

  throw new Error(
    `Timed out waiting for transaction confirmation on ${network}.`,
  );
}
