import type { AuthorizationContext, PrivyClient } from "@privy-io/node";
import type { GenericActionCtx } from "convex/server";

import { internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { isRetryableAutoDepositError } from "./evmSendErrors";
import {
  depositToEarnVault,
  fetchEarnVaultDetails,
  fetchEarnVaultPosition,
  getEarnVaultId,
  isEarnActionFailed,
  isEarnActionSucceeded,
  pollEarnWalletAction,
  withdrawFromEarnVault,
} from "./earn";
import { fetchErc20Balance } from "./fetchErc20Balance";
import {
  countPrivyTransferLegs,
  privyTransferGasReserveRaw,
} from "./gasTokens";
import { getNetworkFromCaip2 } from "./networks";
import { formatPrivyTransferAmount } from "./privyTransfer";
import { retrySendOperation } from "./retrySendOperation";
import { sumVaultUsdcLegsRaw, type VaultUsdcLeg } from "./vaultUsdcLeg";
import { waitForErc20Balance } from "./waitForErc20Balance";
import { waitForEvmSendSlot } from "./waitForEvmSendSlot";

export type VaultSendWithdrawal = {
  withdrawnRaw: bigint;
  walletBalanceBefore: bigint;
  vaultId: string;
  vaultNetwork: string;
  tokenAddress: string;
  decimals: number;
};

/** Serializable form returned from Convex actions to the client. */
export type VaultSendWithdrawalRecord = {
  withdrawnRaw: string;
  walletBalanceBefore: string;
  vaultId: string;
  vaultNetwork: string;
  tokenAddress: string;
  decimals: number;
};

export function serializeVaultSendWithdrawal(
  withdrawal: VaultSendWithdrawal,
): VaultSendWithdrawalRecord {
  return {
    withdrawnRaw: withdrawal.withdrawnRaw.toString(),
    walletBalanceBefore: withdrawal.walletBalanceBefore.toString(),
    vaultId: withdrawal.vaultId,
    vaultNetwork: withdrawal.vaultNetwork,
    tokenAddress: withdrawal.tokenAddress,
    decimals: withdrawal.decimals,
  };
}

export function parseVaultSendWithdrawalRecord(
  record: VaultSendWithdrawalRecord,
): VaultSendWithdrawal {
  return {
    withdrawnRaw: BigInt(record.withdrawnRaw),
    walletBalanceBefore: BigInt(record.walletBalanceBefore),
    vaultId: record.vaultId,
    vaultNetwork: record.vaultNetwork,
    tokenAddress: record.tokenAddress,
    decimals: record.decimals,
  };
}

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
}): Promise<VaultSendWithdrawal | null> {
  if (!params.useVaultUsdc) {
    return null;
  }

  const sender = await params.ctx.runQuery(
    internal.users.getVaultSendSenderByEthereumAddress,
    { ethereumAddress: params.ethereumAddress },
  );
  if (!sender) {
    return null;
  }

  let vaultId: string;
  try {
    vaultId = getEarnVaultId();
  } catch {
    return null;
  }

  let vault;
  try {
    vault = await fetchEarnVaultDetails(vaultId);
  } catch (error) {
    console.error("[vault-send] vault details failed", { error });
    return null;
  }

  const vaultNetwork = getNetworkFromCaip2(vault.caip2);
  if (!vaultNetwork) {
    return null;
  }

  const paymentRaw = sumVaultUsdcLegsRaw(
    params.legs,
    vaultNetwork,
    vault.asset.address,
  );
  if (paymentRaw <= 0n) {
    return null;
  }

  const privyLegCount = countPrivyTransferLegs(params.legs);
  const gasHeadroom =
    privyLegCount > 0
      ? privyTransferGasReserveRaw(vaultNetwork, vault.asset.decimals, privyLegCount)
      : 0n;
  const requiredRaw = paymentRaw + gasHeadroom;

  const walletBalance = await fetchErc20Balance({
    network: vaultNetwork,
    tokenAddress: vault.asset.address,
    holder: params.ethereumAddress,
  });
  const walletBalanceBefore = walletBalance;
  if (walletBalance >= requiredRaw) {
    return null;
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
    return null;
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

  return {
    withdrawnRaw: withdrawRaw,
    walletBalanceBefore,
    vaultId,
    vaultNetwork,
    tokenAddress: vault.asset.address,
    decimals: vault.asset.decimals,
  };
}

/**
 * Returns vault USDC pulled for a failed send back into the earn vault.
 * Wallet balance is spent first during payment, so only unused vault proceeds
 * are redeposited.
 */
export async function tryRedepositVaultUsdcAfterFailedSend(params: {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  ethereumAddress: string;
  ethereumWalletId: string;
  withdrawal: VaultSendWithdrawal;
}): Promise<void> {
  const { withdrawal } = params;
  if (withdrawal.withdrawnRaw <= 0n) {
    return;
  }

  const walletBalance = await fetchErc20Balance({
    network: withdrawal.vaultNetwork,
    tokenAddress: withdrawal.tokenAddress,
    holder: params.ethereumAddress,
  });

  const surplus = walletBalance - withdrawal.walletBalanceBefore;
  const amountToRedeposit =
    surplus <= 0n
      ? 0n
      : surplus > withdrawal.withdrawnRaw
        ? withdrawal.withdrawnRaw
        : surplus;

  if (amountToRedeposit <= 0n) {
    return;
  }

  try {
    await retrySendOperation(
      async () => {
        await waitForEvmSendSlot(withdrawal.vaultNetwork, params.ethereumAddress);

        const pending = await depositToEarnVault({
          privy: params.privy,
          authorizationContext: params.authorizationContext,
          walletId: params.ethereumWalletId,
          vaultId: withdrawal.vaultId,
          amount: formatPrivyTransferAmount(
            amountToRedeposit,
            withdrawal.decimals,
          ),
        });

        const final = await pollEarnWalletAction(
          params.ethereumWalletId,
          pending.id,
        );

        if (isEarnActionFailed(final)) {
          throw new Error(
            final.failure_reason?.message ??
              `Vault redeposit ${final.status} for ${params.ethereumAddress}`,
          );
        }

        if (!isEarnActionSucceeded(final)) {
          throw new Error(
            `Vault redeposit still ${final.status} for ${params.ethereumAddress}`,
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
    console.error("[vault-send] redeposit after failed send failed", {
      ethereumAddress: params.ethereumAddress,
      amountToRedeposit: amountToRedeposit.toString(),
      withdrawnRaw: withdrawal.withdrawnRaw.toString(),
      error,
    });
  }
}
