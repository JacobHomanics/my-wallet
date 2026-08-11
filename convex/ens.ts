import { v } from "convex/values";

import { action } from "./_generated/server";
import { resolveEnsName } from "./lib/ens";

/**
 * Resolve an ENS name to an Ethereum address.
 */
export const resolve = action({
  args: {
    name: v.string(),
  },
  handler: async (_ctx, { name }) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    return await resolveEnsName(trimmed);
  },
});
