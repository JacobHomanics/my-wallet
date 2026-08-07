import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

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

/** Find users by username or account number prefix (case-insensitive username). */
export const search = query({
  args: {
    query: v.string(),
    excludeExternalId: v.optional(v.string()),
  },
  handler: async (ctx, { query, excludeExternalId }) => {
    const trimmed = query.trim();
    const usernamePrefix = trimmed.replace(/^@/, "").toLowerCase();
    if (trimmed.length < 1) {
      return [];
    }

    const byId = new Map<string, Doc<"users">>();

    if (usernamePrefix.length >= 1) {
      const matches = await ctx.db
        .query("users")
        .withIndex("by_username", (q) =>
          q
            .gte("username", usernamePrefix)
            .lt("username", usernamePrefix + "\uffff"),
        )
        .take(20);

      for (const user of matches) {
        if (
          typeof user.username === "string" &&
          user.username.startsWith(usernamePrefix) &&
          user.externalId !== excludeExternalId
        ) {
          byId.set(user._id, user);
        }
      }
    }

    const identityMatches = await ctx.db
      .query("users")
      .withIndex("by_identityId", (q) =>
        q.gte("identityId", trimmed).lt("identityId", trimmed + "\uffff"),
      )
      .take(20);

    for (const user of identityMatches) {
      if (
        typeof user.identityId === "string" &&
        user.identityId.startsWith(trimmed) &&
        user.externalId !== excludeExternalId
      ) {
        byId.set(user._id, user);
      }
    }

    return Array.from(byId.values()).slice(0, 20);
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
