import type { AuthorizationContext, PrivyClient } from "@privy-io/node";
import type { GenericActionCtx } from "convex/server";

import { internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { isRetryableAutoDepositError } from "./evmSendErrors";
import {
  fetchEarnVaultDetails,
  fetchEarnVaultPosition,
  getEarnVaultId,
  isEarnActionFailed,
  isEarnActionSucceeded,
  pollEarnWalletAction,
  withdrawFromEarnVault,
} from "./earn";
import { fetchErc20Balance } from "./fetchErc20Balance";
import { getNetworkFromCaip2 } from "./networks";
import { retrySendOperation } from "./retrySendOperation";
import { sumVaultUsdcLegsRaw, type VaultUsdcLeg } from "./vaultUsdcLeg";
import { waitForErc20Balance } from "./waitForErc20Balance";
import { waitForEvmSendSlot } from "./waitForEvmSendSlot";

/**
 * When the sender has vault-send enabled, withdraw enough vault USDC into their
 * wallet to cover Base USDC payment legs before broadcasting transfers.
 */
export async function tryWithdrawVaultUsdcForSend(params: {
  ctx: GenericActionCtx<DataModel>;
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  ethereumAddress: string;
  ethereumWalletId: string;
  legs: readonly VaultUsdcLeg[];
  useVaultUsdc: boolean;
}): Promise<void> {
  if (!params.useVaultUsdc) {
    return;
  }

  const sender = await params.ctx.runQuery(
    internal.users.getVaultSendSenderByEthereumAddress,
    { ethereumAddress: params.ethereumAddress },
  );
  if (!sender) {
    return;
  }

  let vaultId: string;
  try {
    vaultId = getEarnVaultId();
  } catch {
    return;
  }

  let vault;
  try {
    vault = await fetchEarnVaultDetails(vaultId);
  } catch (error) {
    console.error("[vault-send] vault details failed", { error });
    return;
  }

  const vaultNetwork = getNetworkFromCaip2(vault.caip2);
  if (!vaultNetwork) {
    return;
  }

  const requiredRaw = sumVaultUsdcLegsRaw(
    params.legs,
    vaultNetwork,
    vault.asset.address,
  );
  if (requiredRaw <= 0n) {
    return;
  }

  const walletBalance = await fetchErc20Balance({
    network: vaultNetwork,
    tokenAddress: vault.asset.address,
    holder: params.ethereumAddress,
  });
  if (walletBalance >= requiredRaw) {
    return;
  }

  const shortfall = requiredRaw - walletBalance;

  let position;
  try {
    position = await fetchEarnVaultPosition(params.ethereumWalletId, vaultId);
  } catch (error) {
    console.error("[vault-send] vault position failed", { error });
    throw new Error(
      "Could not read your vault balance. Try again or turn off “Use vault balance”.",
    );
  }

  const vaultRaw = BigInt(position.assets_in_vault);
  if (vaultRaw <= 0n) {
    throw new Error(
      "Not enough USDC in your wallet or vault to complete this payment.",
    );
  }

  const withdrawRaw = shortfall > vaultRaw ? vaultRaw : shortfall;
  if (withdrawRaw <= 0n) {
    return;
  }

  if (walletBalance + withdrawRaw < requiredRaw) {
    throw new Error(
      "Not enough USDC in your wallet and vault to complete this payment.",
    );
  }

  try {
    await retrySendOperation(
      async () => {
        await waitForEvmSendSlot(vaultNetwork, params.ethereumAddress);

        const pending = await withdrawFromEarnVault({
          privy: params.privy,
          authorizationContext: params.authorizationContext,
          walletId: params.ethereumWalletId,
          vaultId,
          rawAmount: withdrawRaw.toString(),
        });

        const final = await pollEarnWalletAction(
          params.ethereumWalletId,
          pending.id,
        );

        if (isEarnActionFailed(final)) {
          throw new Error(
            final.failure_reason?.message ??
              `Vault withdrawal ${final.status} for ${params.ethereumAddress}`,
          );
        }

        if (!isEarnActionSucceeded(final)) {
          throw new Error(
            `Vault withdrawal still ${final.status} for ${params.ethereumAddress}`,
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
    console.error("[vault-send] withdraw failed", {
      ethereumAddress: params.ethereumAddress,
      withdrawRaw: withdrawRaw.toString(),
      requiredRaw: requiredRaw.toString(),
      error,
    });
    throw error instanceof Error
      ? error
      : new Error("Vault withdrawal failed. Try again shortly.");
  }

  try {
    await waitForErc20Balance({
      network: vaultNetwork,
      tokenAddress: vault.asset.address,
      holder: params.ethereumAddress,
      minRaw: requiredRaw,
    });
  } catch (error) {
    console.error("[vault-send] balance wait failed", {
      ethereumAddress: params.ethereumAddress,
      requiredRaw: requiredRaw.toString(),
      error,
    });
    throw new Error(
      "Vault withdrawal completed but USDC is not available in your wallet yet. Try again shortly.",
    );
  }
}
