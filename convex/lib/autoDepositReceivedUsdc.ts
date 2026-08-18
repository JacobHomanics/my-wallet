import type { AuthorizationContext, PrivyClient } from "@privy-io/node";
import type { GenericActionCtx } from "convex/server";

import { internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import {
  depositToEarnVault,
  fetchEarnVaultDetails,
  getEarnVaultId,
} from "./earn";
import {
  getNetworkChain,
  getNetworkFromCaip2,
  isNativeTokenAddress,
} from "./networks";
import { SERVICE_FEE_EVM_ADDRESS } from "./tax";
import { normalizeEvmAddress } from "./walletIdentity";
import { waitForEvmReceipt } from "./waitForEvmReceipt";

type AutoDepositLeg = {
  network: string;
  tokenAddress: string | null;
  symbol: string;
  recipient: string;
  amountFormatted: string;
  isTax?: boolean;
};

const LOG_PREFIX = "[auto-deposit]";

function logAutoDeposit(
  event: string,
  data: Record<string, unknown>,
): void {
  console.log(`${LOG_PREFIX} ${event}`, data);
}

function legContext(leg: AutoDepositLeg, txHash: string) {
  return {
    txHash,
    network: leg.network,
    symbol: leg.symbol,
    tokenAddress: leg.tokenAddress,
    recipient: normalizeEvmAddress(leg.recipient),
    amount: leg.amountFormatted,
    isTax: leg.isTax === true,
  };
}

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
  chainLabel: string,
): Promise<string | null> {
  try {
    const wallet = await privy.wallets().getWalletByAddress({ address });
    return wallet?.id?.trim() || null;
  } catch (error) {
    logAutoDeposit("wallet_lookup_failed", {
      chain: chainLabel,
      address: normalizeEvmAddress(address),
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * After a successful Base USDC transfer, deposit into the recipient's vault when
 * they have auto-deposit enabled. Failures are logged but do not fail the send.
 */
export async function tryAutoDepositReceivedUsdc(params: {
  ctx: GenericActionCtx<DataModel>;
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  leg: AutoDepositLeg;
  txHash: string;
}): Promise<void> {
  const context = legContext(params.leg, params.txHash);
  logAutoDeposit("checking_leg", context);

  if (params.leg.isTax === true) {
    logAutoDeposit("skipped", { ...context, reason: "service_fee_leg" });
    return;
  }

  if (
    normalizeEvmAddress(params.leg.recipient) ===
    normalizeEvmAddress(SERVICE_FEE_EVM_ADDRESS)
  ) {
    logAutoDeposit("skipped", { ...context, reason: "service_fee_address" });
    return;
  }

  if (getNetworkChain(params.leg.network) !== "ethereum") {
    logAutoDeposit("skipped", {
      ...context,
      reason: "non_evm_leg",
      chain: getNetworkChain(params.leg.network),
    });
    return;
  }

  let vaultId: string;
  try {
    vaultId = getEarnVaultId();
  } catch (error) {
    logAutoDeposit("skipped", {
      ...context,
      reason: "vault_not_configured",
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  let vault;
  try {
    vault = await fetchEarnVaultDetails(vaultId);
  } catch (error) {
    logAutoDeposit("skipped", {
      ...context,
      reason: "vault_details_failed",
      vaultId,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const vaultNetwork = getNetworkFromCaip2(vault.caip2);
  if (!vaultNetwork || params.leg.network !== vaultNetwork) {
    logAutoDeposit("skipped", {
      ...context,
      reason: "network_mismatch",
      legNetwork: params.leg.network,
      vaultNetwork,
      vaultCaip2: vault.caip2,
    });
    return;
  }

  if (!isVaultAssetLeg(params.leg, vault.asset.address)) {
    logAutoDeposit("skipped", {
      ...context,
      reason: "token_mismatch",
      vaultAssetAddress: vault.asset.address,
      vaultAssetSymbol: vault.asset.symbol,
    });
    return;
  }

  const recipient = await params.ctx.runQuery(
    internal.users.getAutoDepositRecipientByEthereumAddress,
    { ethereumAddress: params.leg.recipient },
  );

  if (recipient) {
    logAutoDeposit("recipient_matched", {
      ...context,
      recipientUserId: recipient.userId,
      candidateCount: recipient.candidateCount,
    });
  }

  if (!recipient) {
    logAutoDeposit("skipped", {
      ...context,
      reason: "recipient_not_eligible",
      hint: "No user with auto-deposit enabled matches this address via identityId",
    });
    return;
  }

  try {
    await waitForEvmReceipt(params.leg.network, params.txHash);
  } catch (error) {
    logAutoDeposit("skipped", {
      ...context,
      reason: "transfer_confirmation_failed",
      recipientUserId: recipient.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const recipientWalletId = await resolveWalletId(
    params.privy,
    params.leg.recipient,
    "ethereum",
  );
  if (!recipientWalletId) {
    logAutoDeposit("skipped", {
      ...context,
      reason: "recipient_wallet_not_found",
      recipientUserId: recipient.userId,
    });
    return;
  }

  logAutoDeposit("depositing", {
    ...context,
    recipientUserId: recipient.userId,
    recipientWalletId,
    vaultId,
  });

  try {
    const action = await depositToEarnVault({
      privy: params.privy,
      authorizationContext: params.authorizationContext,
      walletId: recipientWalletId,
      vaultId,
      amount: params.leg.amountFormatted,
    });
    logAutoDeposit("deposit_submitted", {
      ...context,
      recipientUserId: recipient.userId,
      recipientWalletId,
      vaultId,
      actionId: action.id,
      actionStatus: action.status,
    });
  } catch (error) {
    logAutoDeposit("deposit_failed", {
      ...context,
      recipientUserId: recipient.userId,
      recipientWalletId,
      vaultId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
