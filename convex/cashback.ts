"use node";

import { v } from "convex/values";

import { action } from "./_generated/server";
import { redeemPointsForUsdc } from "./lib/redeemPoints";
import { getAuthorizationContext, getPrivyClient } from "./lib/privy";

/** Redeem CashBox Points for USDC (points → treasury, USDC → user). */
export const redeem = action({
  args: {
    ethereumWalletId: v.string(),
    ethereumAddress: v.string(),
    pointsAmount: v.string(),
  },
  handler: async (_ctx, args) => {
    const privy = getPrivyClient();
    const authorizationContext = getAuthorizationContext();

    return await redeemPointsForUsdc({
      privy,
      authorizationContext,
      ethereumWalletId: args.ethereumWalletId.trim(),
      ethereumAddress: args.ethereumAddress.trim(),
      pointsAmount: args.pointsAmount.trim(),
    });
  },
});
