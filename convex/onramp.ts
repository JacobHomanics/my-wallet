import { v } from "convex/values";

import { action } from "./_generated/server";
import { createCryptoOnrampSession } from "./lib/stripe";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Create a Stripe embedded Crypto Onramp session for the caller's wallet.
 * Returns only the client secret needed to mount the widget.
 */
export const createSession = action({
  args: {
    walletAddress: v.string(),
    sourceAmount: v.optional(v.string()),
    sourceCurrency: v.optional(v.string()),
    customerIpAddress: v.optional(v.string()),
    destinationCurrency: v.optional(v.string()),
    destinationNetwork: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const walletAddress = args.walletAddress.trim();
    if (!EVM_ADDRESS_RE.test(walletAddress)) {
      throw new Error("Invalid EVM wallet address.");
    }

    return await createCryptoOnrampSession({
      walletAddress,
      sourceAmount: args.sourceAmount,
      sourceCurrency: args.sourceCurrency,
      customerIpAddress: args.customerIpAddress,
      destinationCurrency: args.destinationCurrency,
      destinationNetwork: args.destinationNetwork,
    });
  },
});
