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

/** Find users whose username starts with the query (case-insensitive). */
export const search = query({
  args: {
    query: v.string(),
    excludeExternalId: v.optional(v.string()),
  },
  handler: async (ctx, { query, excludeExternalId }) => {
    const prefix = query.trim().replace(/^@/, "").toLowerCase();
    if (prefix.length < 1) {
      return [];
    }

    const matches = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.gte("username", prefix).lt("username", prefix + "\uffff"),
      )
      .take(20);

    return matches.filter(
      (user) =>
        typeof user.username === "string" &&
        user.username.startsWith(prefix) &&
        user.externalId !== excludeExternalId,
    );
  },
});

/** Insert a users row for this Privy DID if one does not already exist. */
export const ensureByExternalId = mutation({
  args: {
    externalId: v.string(),
    identityId: v.optional(v.string()),
  },
  handler: async (ctx, { externalId, identityId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    const normalizedIdentity = identityId?.trim() || undefined;

    if (existing) {
      if (
        normalizedIdentity &&
        existing.identityId !== normalizedIdentity
      ) {
        await ctx.db.patch(existing._id, { identityId: normalizedIdentity });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      externalId,
      identityId: normalizedIdentity,
    });
  },
});

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

/** Set or clear the username for a Privy user. Enforces uniqueness. */
export const setUsername = mutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, { externalId, username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const normalized = username?.trim().toLowerCase() || undefined;

    if (normalized !== undefined && !USERNAME_PATTERN.test(normalized)) {
      throw new Error(
        "Username must be 3–24 characters: letters, numbers, or underscores",
      );
    }

    if (normalized) {
      const taken = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", normalized))
        .unique();

      if (taken && taken._id !== user._id) {
        throw new Error("Username already taken");
      }
    }

    await ctx.db.patch(user._id, { username: normalized });
    return user._id;
  },
});
