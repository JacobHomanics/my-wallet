import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/** List contacts for the signed-in Privy user. */
export const listForOwner = query({
  args: { ownerExternalId: v.string() },
  handler: async (ctx, { ownerExternalId }) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_owner", (q) => q.eq("ownerExternalId", ownerExternalId))
      .collect();
  },
});

/** Add a user to the owner's contacts list (idempotent). */
export const add = mutation({
  args: {
    ownerExternalId: v.string(),
    contactUserId: v.id("users"),
  },
  handler: async (ctx, { ownerExternalId, contactUserId }) => {
    const contactUser = await ctx.db.get(contactUserId);
    if (!contactUser) {
      throw new Error("User not found");
    }

    if (!contactUser.username) {
      throw new Error("User has no username");
    }

    if (contactUser.externalId === ownerExternalId) {
      throw new Error("You can't add yourself as a contact");
    }

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_contact", (q) =>
        q
          .eq("ownerExternalId", ownerExternalId)
          .eq("contactUserId", contactUserId),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerExternalId,
      contactUserId,
      contactUsername: contactUser.username,
    });
  },
});
