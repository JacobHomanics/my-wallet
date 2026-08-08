import { v } from "convex/values";

import { action } from "./_generated/server";
import { searchUsers } from "./lib/neynar";

/**
 * Search Farcaster users by username prefix via Neynar.
 */
export const search = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, { query, limit }) => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      return [];
    }

    return await searchUsers(trimmed, limit ?? 8);
  },
});
