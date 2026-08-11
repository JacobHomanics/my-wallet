import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/** Look up a user by Privy DID (`externalId`). */
export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (!user) {
      return null;
    }

    const profilePhotoUrl = user.profilePhotoId
      ? await ctx.storage.getUrl(user.profilePhotoId)
      : null;

    return {
      ...user,
      profilePhotoUrl,
    };
  },
});

/** Look up a user by wallet identity / account number. */
export const getByIdentityId = query({
  args: { identityId: v.string() },
  handler: async (ctx, { identityId }) => {
    const trimmed = identityId.trim();
    if (!trimmed) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_identityId", (q) => q.eq("identityId", trimmed))
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

    const users = Array.from(byId.values()).slice(0, 20);

    return await Promise.all(
      users.map(async (user) => {
        const profilePhotoUrl = user.profilePhotoId
          ? await ctx.storage.getUrl(user.profilePhotoId)
          : null;

        return {
          ...user,
          profilePhotoUrl,
        };
      }),
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
      onboardingCompleted: false,
    });
  },
});

/** Mark first-time profile onboarding as finished (Continue or Skip). */
export const completeOnboarding = mutation({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, { externalId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.onboardingCompleted === true) {
      return user._id;
    }

    await ctx.db.patch(user._id, { onboardingCompleted: true });
    return user._id;
  },
});

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

/**
 * Check whether a username is free. Treats the caller's current username as
 * available so edits that keep the same name still pass.
 */
export const isUsernameAvailable = query({
  args: {
    username: v.string(),
    excludeExternalId: v.optional(v.string()),
  },
  handler: async (ctx, { username, excludeExternalId }) => {
    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      return { available: false as const, reason: "invalid" as const };
    }

    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();

    if (!taken) {
      return { available: true as const, reason: "free" as const };
    }

    if (excludeExternalId && taken.externalId === excludeExternalId) {
      return { available: true as const, reason: "own" as const };
    }

    return { available: false as const, reason: "taken" as const };
  },
});

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

/** Generate a short-lived URL for uploading a profile photo. */
export const generateUploadUrl = mutation({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, { externalId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/** Save a newly uploaded profile photo and remove the previous one. */
export const setProfilePhoto = mutation({
  args: {
    externalId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { externalId, storageId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const previousPhotoId = user.profilePhotoId;
    await ctx.db.patch(user._id, { profilePhotoId: storageId });

    if (previousPhotoId && previousPhotoId !== storageId) {
      await ctx.storage.delete(previousPhotoId);
    }

    return user._id;
  },
});

/** Clear the profile photo and delete the stored file. */
export const clearProfilePhoto = mutation({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, { externalId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const previousPhotoId = user.profilePhotoId;
    await ctx.db.patch(user._id, { profilePhotoId: undefined });

    if (previousPhotoId) {
      await ctx.storage.delete(previousPhotoId);
    }

    return user._id;
  },
});
