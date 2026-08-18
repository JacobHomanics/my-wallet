import type { AuthorizationContext, PrivyClient } from "@privy-io/node";

import { encodeErc20Transfer } from "./encodeErc20Transfer";
import {
  getEvmCaip2,
  getEvmChainId,
  isNativeTokenAddress,
  toHexQuantity,
} from "./networks";
import { retrySendOperation } from "./retrySendOperation";
import { waitForEvmSendSlot } from "./waitForEvmSendSlot";
import { waitForEvmReceipt } from "./waitForEvmReceipt";
import { waitForPrivyTransactionHash } from "./waitForPrivyTransaction";

export type SendEvmLegParams = {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  walletId: string;
  fromAddress: string;
  network: string;
  tokenAddress: string | null;
  recipient: string;
  amountRaw: bigint;
};

export type SendEvmBatchLeg = {
  tokenAddress: string | null;
  recipient: string;
  amountRaw: bigint;
};

export type SendEvmBatchParams = {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  walletId: string;
  fromAddress: string;
  network: string;
  legs: SendEvmBatchLeg[];
};

function buildEvmCall(
  tokenAddress: string | null,
  recipient: string,
  amountRaw: bigint,
): { to: string; value?: `0x${string}`; data?: `0x${string}` } {
  const to = recipient.trim();
  const isNative = isNativeTokenAddress(tokenAddress);

  if (isNative) {
    return {
      to,
      value: toHexQuantity(amountRaw),
    };
  }

  return {
    to: tokenAddress!,
    value: toHexQuantity(0n),
    data: encodeErc20Transfer(to, amountRaw),
  };
}

function buildEvmTransaction(
  tokenAddress: string | null,
  recipient: string,
  amountRaw: bigint,
  chainId: number,
) {
  const to = recipient.trim();
  const isNative = isNativeTokenAddress(tokenAddress);

  return isNative
    ? {
        to,
        value: toHexQuantity(amountRaw),
        chain_id: chainId,
      }
    : {
        to: tokenAddress!,
        value: toHexQuantity(0n),
        data: encodeErc20Transfer(to, amountRaw),
        chain_id: chainId,
      };
}

/**
 * Broadcast an EVM native or ERC-20 transfer via Privy Wallet API.
 */
export async function sendEvmLeg(params: SendEvmLegParams): Promise<string> {
  const {
    privy,
    authorizationContext,
    walletId,
    fromAddress,
    network,
    tokenAddress,
    recipient,
    amountRaw,
  } = params;

  const chainId = getEvmChainId(network);
  const caip2 = getEvmCaip2(network);
  const transaction = buildEvmTransaction(
    tokenAddress,
    recipient,
    amountRaw,
    chainId,
  );

  return retrySendOperation(async () => {
    await waitForEvmSendSlot(network, fromAddress);

    const result = await privy.wallets().ethereum().sendTransaction(walletId, {
      caip2,
      params: { transaction },
      authorization_context: authorizationContext,
    });

    if (!result.hash) {
      throw new Error(`EVM send on ${network} returned no hash`);
    }
    return result.hash;
  });
}

/**
 * Batch multiple EVM calls into one atomic `wallet_sendCalls` transaction.
 * Avoids Base/EIP-7702 in-flight limits when a payment has multiple same-network legs.
 */
export async function sendEvmBatch(params: SendEvmBatchParams): Promise<string> {
  const {
    privy,
    authorizationContext,
    walletId,
    fromAddress,
    network,
    legs,
  } = params;

  if (legs.length === 0) {
    throw new Error("Nothing to batch");
  }
  if (legs.length === 1) {
    const leg = legs[0]!;
    return sendEvmLeg({
      privy,
      authorizationContext,
      walletId,
      fromAddress,
      network,
      tokenAddress: leg.tokenAddress,
      recipient: leg.recipient,
      amountRaw: leg.amountRaw,
    });
  }

  const caip2 = getEvmCaip2(network);
  const calls = legs.map((leg) =>
    buildEvmCall(leg.tokenAddress, leg.recipient, leg.amountRaw),
  );

  return retrySendOperation(async () => {
    await waitForEvmSendSlot(network, fromAddress);

    const result = await privy.wallets().ethereum().sendCalls(walletId, {
      caip2,
      params: { calls },
      authorization_context: authorizationContext,
    });

    if (!result.transaction_id) {
      throw new Error(`EVM batch on ${network} returned no transaction id`);
    }

    return waitForPrivyTransactionHash(privy, result.transaction_id).then(
      (hash) => waitForEvmReceipt(network, hash).then(() => hash),
    );
  });
}
