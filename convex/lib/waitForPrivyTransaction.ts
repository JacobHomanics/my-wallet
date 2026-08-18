import type { PrivyClient } from "@privy-io/node";

const POLL_MS = 1_200;
const DEFAULT_TIMEOUT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const TERMINAL_FAILURE_STATUSES = new Set([
  "failed",
  "execution_reverted",
  "provider_error",
  "replaced",
]);

/**
 * Resolves an on-chain hash for a Privy `wallet_sendCalls` transaction id.
 */
export async function waitForPrivyTransactionHash(
  privy: PrivyClient,
  transactionId: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const transaction = await privy.transactions().get(transactionId);
    if (transaction.transaction_hash) {
      return transaction.transaction_hash;
    }
    if (TERMINAL_FAILURE_STATUSES.has(transaction.status)) {
      throw new Error(
        `Privy transaction ${transactionId} failed with status ${transaction.status}`,
      );
    }
    await sleep(POLL_MS);
  }

  throw new Error(
    `Timed out waiting for Privy transaction ${transactionId} to broadcast`,
  );
}
