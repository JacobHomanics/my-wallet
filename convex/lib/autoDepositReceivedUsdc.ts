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
import { waitForEvmReceipt } from "./waitForEvmReceipt";
import { normalizeEvmAddress } from "./walletIdentity";

type AutoDepositLeg = {
  network: string;
  tokenAddress: string | null;
  symbol: string;
  recipient: string;
  amountFormatted: string;
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
  if (getNetworkChain(params.leg.network) !== "ethereum") {
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
  } catch {
    return;
  }

  const vaultNetwork = getNetworkFromCaip2(vault.caip2);
  if (!vaultNetwork || params.leg.network !== vaultNetwork) {
    return;
  }

  if (!isVaultAssetLeg(params.leg, vault.asset.address)) {
    return;
  }

  const recipient = await params.ctx.runQuery(
    internal.users.getAutoDepositRecipientByEthereumAddress,
    { ethereumAddress: params.leg.recipient },
  );
  if (!recipient) {
    return;
  }

  try {
    await waitForEvmReceipt(params.leg.network, params.txHash);
  } catch {
    return;
  }

  const recipientWalletId = await resolveWalletId(
    params.privy,
    params.leg.recipient,
  );
  if (!recipientWalletId) {
    return;
  }

  try {
    await depositToEarnVault({
      privy: params.privy,
      authorizationContext: params.authorizationContext,
      walletId: recipientWalletId,
      vaultId,
      amount: params.leg.amountFormatted,
    });
  } catch {
    // Auto-deposit failure must not fail the send.
  }
}
