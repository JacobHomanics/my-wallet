import { v } from "convex/values";

import { action } from "./_generated/server";
import { resolveSnsName } from "./lib/sns";

/** Resolve a .sol / .sns domain to a Solana address. */
export const resolve = action({
  args: { domain: v.string() },
  handler: async (_ctx, { domain }) => {
    const trimmed = domain.trim();
    if (!trimmed) {
      return null;
    }
    return await resolveSnsName(trimmed);
  },
});
