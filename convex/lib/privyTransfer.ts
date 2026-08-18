import type { AuthorizationContext, PrivyClient } from "@privy-io/node";

import {
  privyTransferGasReserveRaw,
  resolvePrivyTransferAsset,
  resolvePrivyTransferChain,
} from "./gasTokens";
import { retrySendOperation } from "./retrySendOperation";
import { waitForErc20Balance } from "./waitForErc20Balance";
import { waitForEvmReceipt } from "./waitForEvmReceipt";
import { waitForEvmSendSlot } from "./waitForEvmSendSlot";

const POLL_MS = 1_200;
const DEFAULT_TIMEOUT_MS = 120_000;
const SUCCEEDED_GRACE_MS = 20_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Decimal string for Privy Transfer API (e.g. 200013n, 6 → "0.200013"). */
export function formatPrivyTransferAmount(
  amountRaw: bigint,
  decimals: number,
): string {
  if (amountRaw <= 0n) {
    throw new Error("Transfer amount must be positive");
  }
  if (decimals <= 0) {
    return amountRaw.toString();
  }

  const negative = amountRaw < 0n;
  const raw = negative ? -amountRaw : amountRaw;
  const padded = raw.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  const formatted = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  return negative ? `-${formatted}` : formatted;
}

type WalletActionStepLike = {
  type?: string;
  transaction_hash?: string | null;
  bundle_transaction_hash?: string | null;
};

function extractEvmTransactionHash(
  steps: readonly WalletActionStepLike[] | undefined,
): string | null {
  if (steps == null) {
    return null;
  }
  for (const step of steps) {
    if (step.type === "evm_transaction" && step.transaction_hash) {
      return step.transaction_hash;
    }
    if (step.type === "evm_user_operation" && step.bundle_transaction_hash) {
      return step.bundle_transaction_hash;
    }
  }
  return null;
}

async function findRecentTransferHash(
  privy: PrivyClient,
  walletId: string,
  chain: string,
  asset: string,
  actionCreatedAtMs: number,
): Promise<string | null> {
  try {
    const response = await privy.wallets().transactions.get(walletId, {
      chain: chain as "base",
      asset: asset as "usdc",
      limit: 10,
    });

    for (const tx of response.transactions) {
      if (!tx.transaction_hash) {
        continue;
      }
      const createdAtMs = tx.created_at * 1000;
      if (createdAtMs + 5_000 >= actionCreatedAtMs) {
        return tx.transaction_hash;
      }
    }
  } catch {
    // Fall back to step polling when history is unavailable.
  }
  return null;
}

function parseActionCreatedAtMs(createdAt: string | undefined): number {
  if (createdAt == null) {
    return Date.now();
  }
  const parsed = Date.parse(createdAt);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

async function waitForTransferActionHash(
  privy: PrivyClient,
  walletId: string,
  actionId: string,
  chain: string,
  asset: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let succeededAt: number | null = null;
  let actionCreatedAtMs = Date.now();

  while (Date.now() < deadline) {
    const action = await privy.wallets().actions.get(actionId, {
      wallet_id: walletId,
      include: "steps",
    });

    actionCreatedAtMs = parseActionCreatedAtMs(action.created_at);

    if (action.status === "failed" || action.status === "rejected") {
      const reason =
        action.failure_reason?.message ?? action.status;
      throw new Error(`Transfer failed: ${reason}`);
    }

    const hash = extractEvmTransactionHash(action.steps);
    if (hash != null) {
      return hash;
    }

    if (action.status === "succeeded") {
      if (succeededAt == null) {
        succeededAt = Date.now();
      }

      const fallbackHash = await findRecentTransferHash(
        privy,
        walletId,
        chain,
        asset,
        actionCreatedAtMs,
      );
      if (fallbackHash != null) {
        return fallbackHash;
      }

      if (Date.now() - succeededAt >= SUCCEEDED_GRACE_MS) {
        throw new Error("Transfer succeeded but returned no transaction hash");
      }
    }

    await sleep(POLL_MS);
  }

  throw new Error("Timed out waiting for Privy transfer confirmation");
}

export type SendPrivyTransferLegParams = {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  walletId: string;
  fromAddress: string;
  network: string;
  tokenAddress: string;
  recipient: string;
  amountRaw: bigint;
  decimals: number;
};

/**
 * Sends a Base stablecoin via Privy's Transfer API so gas is paid in the
 * same token (user-pays mode). Raw RPC sends require native ETH for gas.
 */
export async function sendPrivyTransferLeg(
  params: SendPrivyTransferLegParams,
): Promise<string> {
  const asset = resolvePrivyTransferAsset(
    params.network,
    params.tokenAddress,
  );
  const chain = resolvePrivyTransferChain(params.network);
  if (asset == null || chain == null) {
    throw new Error(
      `Token on ${params.network} is not supported for Privy transfer gas`,
    );
  }

  const recipient = params.recipient.trim();
  const amountRaw = params.amountRaw;
  const gasReserveRaw = privyTransferGasReserveRaw(
    params.network,
    params.decimals,
  );

  if (gasReserveRaw > 0n) {
    if (amountRaw <= 0n) {
      throw new Error(
        `Not enough ${asset.toUpperCase()} to cover the transfer and network fees.`,
      );
    }

    try {
      await waitForErc20Balance({
        network: params.network,
        tokenAddress: params.tokenAddress,
        holder: params.fromAddress,
        minRaw: amountRaw + gasReserveRaw,
      });
    } catch {
      throw new Error(
        `Not enough ${asset.toUpperCase()} to cover the transfer and network fees.`,
      );
    }
  }

  const amount = formatPrivyTransferAmount(amountRaw, params.decimals);

  return retrySendOperation(async () => {
    await waitForEvmSendSlot(params.network, params.fromAddress);

    const action = await params.privy.wallets().transfer(params.walletId, {
      authorization_context: params.authorizationContext,
      source: { asset, chain },
      destination: { address: recipient },
      amount,
      amount_type: "exact_input",
    });

    const hash = await waitForTransferActionHash(
      params.privy,
      params.walletId,
      action.id,
      chain,
      asset,
    );
    await waitForEvmReceipt(params.network, hash);
    return hash;
  });
}
