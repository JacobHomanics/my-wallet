import { v } from "convex/values";

import { action } from "./_generated/server";
import { resolveBasename } from "./lib/basenames";

/** Resolve a Basename (name.base.eth) to a Base EVM address. */
export const resolve = action({
  args: { name: v.string() },
  handler: async (_ctx, { name }) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }
    return await resolveBasename(trimmed);
  },
});
