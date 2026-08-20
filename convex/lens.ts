import { v } from "convex/values";

import { action } from "./_generated/server";
import { resolveLensHandle, searchLensAccounts } from "./lib/lens";

/** Search Lens accounts by handle prefix. */
export const search = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, { query, limit }) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    return await searchLensAccounts(trimmed, limit ?? 8);
  },
});

/** Resolve an exact Lens handle. */
export const resolve = action({
  args: { handle: v.string() },
  handler: async (_ctx, { handle }) => {
    const trimmed = handle.trim();
    if (!trimmed) {
      return null;
    }
    return await resolveLensHandle(trimmed);
  },
});
