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
import { PRIVY_TRANSFER_GAS_RESERVE_RAW } from "./gasTokens";
import { getNetworkFromCaip2 } from "./networks";
import { formatPrivyTransferAmount } from "./privyTransfer";
import { retrySendOperation } from "./retrySendOperation";
import { fetchErc20Balance } from "./fetchErc20Balance";
import { waitForErc20Balance } from "./waitForErc20Balance";
import { waitForEvmSendSlot } from "./waitForEvmSendSlot";
import { normalizeEvmAddress } from "./walletIdentity";

/** USDC left in the wallet after auto-depositing an onramp credit (6 decimals). */
export const ONRAMP_VAULT_DEPOSIT_GAS_BUFFER_RAW =
  PRIVY_TRANSFER_GAS_RESERVE_RAW * 5n;

const ONRAMP_BALANCE_WAIT_MS = 600_000;

export type AutoDepositOnrampResult =
  | { status: "skipped"; reason: "disabled" | "not_eligible" | "no_wallet" }
  | { status: "deposited"; amount: string }
  | { status: "nothing_to_deposit" }
  | { status: "balance_timeout" }
  | { status: "failed"; message: string };

/**
 * After a successful Base USDC onramp, deposit the credited amount into the
 * user's earn vault when auto-deposit is enabled.
 */
export async function tryAutoDepositOnrampUsdc(params: {
  ctx: GenericActionCtx<DataModel>;
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  ethereumWalletId: string;
  ethereumAddress: string;
  priorBalanceRaw: bigint;
}): Promise<AutoDepositOnrampResult> {
  const holder = params.ethereumAddress.trim();
  const walletId = params.ethereumWalletId.trim();
  if (!holder || !walletId) {
    return { status: "skipped", reason: "no_wallet" };
  }

  const recipient = await params.ctx.runQuery(
    internal.users.getAutoDepositRecipientByEthereumAddress,
    { ethereumAddress: holder },
  );
  if (recipient == null) {
    return { status: "skipped", reason: "disabled" };
  }

  let vaultId: string;
  try {
    vaultId = getEarnVaultId();
  } catch {
    return { status: "skipped", reason: "not_eligible" };
  }

  let vault;
  try {
    vault = await fetchEarnVaultDetails(vaultId);
  } catch (error) {
    console.error("[onramp-auto-deposit] vault lookup failed", { error });
    return { status: "failed", message: "Could not load vault details." };
  }

  const vaultNetwork = getNetworkFromCaip2(vault.caip2);
  if (vaultNetwork !== "base-mainnet") {
    return { status: "skipped", reason: "not_eligible" };
  }

  const tokenAddress = vault.asset.address.trim();
  const priorBalanceRaw =
    params.priorBalanceRaw >= 0n ? params.priorBalanceRaw : 0n;

  try {
    await waitForErc20Balance({
      network: vaultNetwork,
      tokenAddress,
      holder,
      minRaw: priorBalanceRaw + 1n,
      timeoutMs: ONRAMP_BALANCE_WAIT_MS,
    });
  } catch (error) {
    console.error("[onramp-auto-deposit] balance wait failed", {
      holder,
      priorBalanceRaw: priorBalanceRaw.toString(),
      error,
    });
    return { status: "balance_timeout" };
  }

  const currentBalance = await fetchErc20Balance({
    network: vaultNetwork,
    tokenAddress,
    holder,
  });

  const creditedRaw =
    currentBalance > priorBalanceRaw ? currentBalance - priorBalanceRaw : 0n;
  const depositRaw =
    creditedRaw > ONRAMP_VAULT_DEPOSIT_GAS_BUFFER_RAW
      ? creditedRaw - ONRAMP_VAULT_DEPOSIT_GAS_BUFFER_RAW
      : 0n;

  if (depositRaw <= 0n) {
    return { status: "nothing_to_deposit" };
  }

  let amountFormatted: string;
  try {
    amountFormatted = formatPrivyTransferAmount(
      depositRaw,
      vault.asset.decimals,
    );
  } catch (error) {
    console.error("[onramp-auto-deposit] invalid deposit amount", {
      depositRaw: depositRaw.toString(),
      error,
    });
    return { status: "failed", message: "Deposit amount was invalid." };
  }

  try {
    await retrySendOperation(
      async () => {
        await waitForEvmSendSlot(vaultNetwork, holder);

        const pending = await depositToEarnVault({
          privy: params.privy,
          authorizationContext: params.authorizationContext,
          walletId,
          vaultId,
          amount: amountFormatted,
        });

        const final = await pollEarnWalletAction(walletId, pending.id);

        if (isEarnActionFailed(final)) {
          throw new Error(
            final.failure_reason?.message ??
              `Onramp auto-deposit ${final.status} for ${holder}`,
          );
        }

        if (!isEarnActionSucceeded(final)) {
          throw new Error(
            `Onramp auto-deposit still ${final.status} for ${holder}`,
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
    return { status: "deposited", amount: amountFormatted };
  } catch (error) {
    console.error("[onramp-auto-deposit] deposit failed", {
      holder,
      amount: amountFormatted,
      tokenAddress: normalizeEvmAddress(tokenAddress),
      error,
    });
    const message =
      error instanceof Error
        ? error.message
        : "Could not move funds into your vault.";
    return { status: "failed", message };
  }
}
