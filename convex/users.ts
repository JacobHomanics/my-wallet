import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/** Look up a user by Privy DID (`externalId`). */
export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
  },
});

/** Insert a users row for this Privy DID if one does not already exist. */
export const ensureByExternalId = mutation({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", { externalId });
  },
});
