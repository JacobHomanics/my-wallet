"use node";

import { v } from "convex/values";

import { action } from "./_generated/server";
import {
  depositToEarnVault,
  fetchEarnVaultDetails,
  fetchEarnVaultPosition,
  fetchEarnWalletAction,
  getEarnVaultId,
  withdrawFromEarnVault,
} from "./lib/earn";
import { tryAutoDepositOnrampUsdc } from "./lib/autoDepositOnrampUsdc";
import { getAuthorizationContext, getPrivyClient } from "./lib/privy";

/**
 * Returns configured vault metadata (APY, asset, liquidity).
 * @see https://docs.privy.io/wallets/actions/earn/setup
 */
export const getVaultDetails = action({
  args: {},
  handler: async () => {
    const vaultId = getEarnVaultId();
    return await fetchEarnVaultDetails(vaultId);
  },
});

/** Returns the caller's vault position (balance + yield). */
export const getPosition = action({
  args: {
    ethereumWalletId: v.string(),
  },
  handler: async (_ctx, args) => {
    const vaultId = getEarnVaultId();
    return await fetchEarnVaultPosition(args.ethereumWalletId.trim(), vaultId);
  },
});

/** Poll a pending earn deposit/withdraw action. */
export const getAction = action({
  args: {
    ethereumWalletId: v.string(),
    actionId: v.string(),
  },
  handler: async (_ctx, args) => {
    return await fetchEarnWalletAction(
      args.ethereumWalletId.trim(),
      args.actionId.trim(),
    );
  },
});

/** Deposit assets from the user's embedded wallet into the configured vault. */
export const deposit = action({
  args: {
    ethereumWalletId: v.string(),
    amount: v.string(),
  },
  handler: async (_ctx, args) => {
    const amount = args.amount.trim();
    if (!amount || Number(amount) <= 0) {
      throw new Error("Enter a valid deposit amount.");
    }

    const privy = getPrivyClient();
    const authorizationContext = getAuthorizationContext();
    const vaultId = getEarnVaultId();

    return await depositToEarnVault({
      privy,
      authorizationContext,
      walletId: args.ethereumWalletId.trim(),
      vaultId,
      amount,
    });
  },
});

/** Withdraw assets (including accrued yield) from the configured vault. */
export const withdraw = action({
  args: {
    ethereumWalletId: v.string(),
    amount: v.optional(v.string()),
    rawAmount: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const amount = args.amount?.trim();
    const rawAmount = args.rawAmount?.trim();
    const hasAmount = Boolean(amount);
    const hasRawAmount = Boolean(rawAmount);

    if (hasAmount === hasRawAmount) {
      throw new Error("Provide exactly one of amount or rawAmount.");
    }

    if (amount && Number(amount) <= 0) {
      throw new Error("Enter a valid withdrawal amount.");
    }

    if (rawAmount) {
      try {
        if (BigInt(rawAmount) <= 0n) {
          throw new Error("Enter a valid withdrawal amount.");
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("valid withdrawal")) {
          throw error;
        }
        throw new Error("Enter a valid withdrawal amount.");
      }
    }

    const privy = getPrivyClient();
    const authorizationContext = getAuthorizationContext();
    const vaultId = getEarnVaultId();

    return await withdrawFromEarnVault({
      privy,
      authorizationContext,
      walletId: args.ethereumWalletId.trim(),
      vaultId,
      amount,
      rawAmount,
    });
  },
});

/**
 * After a Base USDC onramp completes, move the credited amount into the earn
 * vault in the background (respects auto-deposit setting, leaves a gas buffer).
 */
export const autoDepositAfterOnramp = action({
  args: {
    ethereumWalletId: v.string(),
    ethereumAddress: v.string(),
    priorBalanceRaw: v.string(),
  },
  handler: async (ctx, args) => {
    let priorBalanceRaw: bigint;
    try {
      priorBalanceRaw = BigInt(args.priorBalanceRaw.trim());
      if (priorBalanceRaw < 0n) {
        throw new Error("Invalid prior balance");
      }
    } catch {
      throw new Error("Invalid prior balance.");
    }

    const privy = getPrivyClient();
    const authorizationContext = getAuthorizationContext();

    await tryAutoDepositOnrampUsdc({
      ctx,
      privy,
      authorizationContext,
      ethereumWalletId: args.ethereumWalletId.trim(),
      ethereumAddress: args.ethereumAddress.trim(),
      priorBalanceRaw,
    });
  },
});
