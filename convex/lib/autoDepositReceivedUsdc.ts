import type { AuthorizationContext, PrivyClient } from "@privy-io/node";
import type { GenericActionCtx } from "convex/server";

import { internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { isRetryableAutoDepositError } from "./evmSendErrors";
import {
  depositToEarnVault,
  fetchEarnVaultDetails,
  getEarnVaultId,
  isEarnActionFailed,
  isEarnActionSucceeded,
  pollEarnWalletAction,
} from "./earn";
import {
  getNetworkChain,
  getNetworkFromCaip2,
  isNativeTokenAddress,
} from "./networks";
import { retrySendOperation } from "./retrySendOperation";
import { waitForErc20Balance } from "./waitForErc20Balance";
import { waitForEvmReceipt } from "./waitForEvmReceipt";
import { waitForEvmSendSlot } from "./waitForEvmSendSlot";
import { normalizeEvmAddress } from "./walletIdentity";

export type AutoDepositLeg = {
  network: string;
  tokenAddress: string | null;
  symbol: string;
  recipient: string;
  amountRaw: bigint;
  amountFormatted: string;
  isTax?: boolean;
};

function isVaultAssetLeg(
  leg: AutoDepositLeg,
  vaultAssetAddress: string,
): boolean {
  if (isNativeTokenAddress(leg.tokenAddress)) {
    return false;
  }

  const symbol = leg.symbol.trim().toLowerCase();
  const isUsdcSymbol = symbol === "usdc" || symbol.startsWith("usdc.");

  if (leg.tokenAddress) {
    const addressMatch =
      normalizeEvmAddress(leg.tokenAddress) ===
      normalizeEvmAddress(vaultAssetAddress);
    return addressMatch || isUsdcSymbol;
  }

  return isUsdcSymbol;
}

async function resolveWalletId(
  privy: PrivyClient,
  address: string,
): Promise<string | null> {
  try {
    const wallet = await privy.wallets().getWalletByAddress({ address });
    return wallet?.id?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * True when this payment leg should be sent individually (not batched) so
 * auto-deposit can run against a dedicated USDC transfer receipt.
 */
export async function isAutoDepositPaymentLeg(params: {
  ctx: GenericActionCtx<DataModel>;
  leg: AutoDepositLeg;
}): Promise<boolean> {
  if (params.leg.isTax === true) {
    return false;
  }
  if (getNetworkChain(params.leg.network) !== "ethereum") {
    return false;
  }

  let vaultId: string;
  try {
    vaultId = getEarnVaultId();
  } catch {
    return false;
  }

  let vault;
  try {
    vault = await fetchEarnVaultDetails(vaultId);
  } catch {
    return false;
  }

  const vaultNetwork = getNetworkFromCaip2(vault.caip2);
  if (!vaultNetwork || params.leg.network !== vaultNetwork) {
    return false;
  }

  if (!isVaultAssetLeg(params.leg, vault.asset.address)) {
    return false;
  }

  const recipient = await params.ctx.runQuery(
    internal.users.getAutoDepositRecipientByEthereumAddress,
    { ethereumAddress: params.leg.recipient },
  );
  return recipient != null;
}

/**
 * After a successful Base USDC transfer, deposit into the recipient's vault when
 * they have auto-deposit enabled. Failures do not fail the send.
 */
export async function tryAutoDepositReceivedUsdc(params: {
  ctx: GenericActionCtx<DataModel>;
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  leg: AutoDepositLeg;
  txHash: string;
}): Promise<void> {
  if (!(await isAutoDepositPaymentLeg({ ctx: params.ctx, leg: params.leg }))) {
    return;
  }

  if (!params.leg.tokenAddress) {
    return;
  }

  const vaultId = getEarnVaultId();

  try {
    await waitForEvmReceipt(params.leg.network, params.txHash);
  } catch (error) {
    console.error("[auto-deposit] receipt wait failed", {
      txHash: params.txHash,
      network: params.leg.network,
      recipient: params.leg.recipient,
      error,
    });
    return;
  }

  const recipientWalletId = await resolveWalletId(
    params.privy,
    params.leg.recipient,
  );
  if (!recipientWalletId) {
    console.error("[auto-deposit] recipient wallet not found", {
      recipient: params.leg.recipient,
    });
    return;
  }

  try {
    await waitForErc20Balance({
      network: params.leg.network,
      tokenAddress: params.leg.tokenAddress,
      holder: params.leg.recipient,
      minRaw: params.leg.amountRaw,
    });
  } catch (error) {
    console.error("[auto-deposit] balance wait failed", {
      txHash: params.txHash,
      recipient: params.leg.recipient,
      amountRaw: params.leg.amountRaw.toString(),
      error,
    });
    return;
  }

  try {
    await retrySendOperation(
      async () => {
        await waitForEvmSendSlot(params.leg.network, params.leg.recipient);

        const pending = await depositToEarnVault({
          privy: params.privy,
          authorizationContext: params.authorizationContext,
          walletId: recipientWalletId,
          vaultId,
          amount: params.leg.amountFormatted,
        });

        const final = await pollEarnWalletAction(
          recipientWalletId,
          pending.id,
        );

        if (isEarnActionFailed(final)) {
          throw new Error(
            final.failure_reason?.message ??
              `Auto-deposit ${final.status} for ${params.leg.recipient}`,
          );
        }

        if (!isEarnActionSucceeded(final)) {
          throw new Error(
            `Auto-deposit still ${final.status} for ${params.leg.recipient}`,
          );
        }

        return final;
      },
      {
        maxAttempts: 8,
        baseDelayMs: 1_000,
        shouldRetry: isRetryableAutoDepositError,
      },
    );
  } catch (error) {
    console.error("[auto-deposit] deposit failed", {
      txHash: params.txHash,
      recipient: params.leg.recipient,
      amount: params.leg.amountFormatted,
      error,
    });
  }
}
