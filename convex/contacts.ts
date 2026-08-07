import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

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

/** Single contact for the signed-in Privy user (null if missing or not owned). */
export const getForOwner = query({
  args: {
    ownerExternalId: v.string(),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { ownerExternalId, contactId }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.ownerExternalId !== ownerExternalId) {
      return null;
    }

    let identityId: string | null = null;
    if (contact.contactUserId) {
      const user = await ctx.db.get(contact.contactUserId);
      identityId = user?.identityId ?? null;
    }

    return {
      _id: contact._id,
      contactUsername: contact.contactUsername ?? null,
      name: contact.name ?? null,
      evmAddress: contact.evmAddress ?? null,
      solanaAddress: contact.solanaAddress ?? null,
      identityId,
      isExternal: !contact.contactUsername,
    };
  },
});

/** Add a registered user to the owner's contacts list (idempotent). */
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

/** Add a contact by EVM and/or Solana address (idempotent). */
export const addByAddresses = mutation({
  args: {
    ownerExternalId: v.string(),
    name: v.string(),
    evmAddress: v.optional(v.string()),
    solanaAddress: v.optional(v.string()),
  },
  handler: async (ctx, { ownerExternalId, name, evmAddress, solanaAddress }) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Enter a name for this contact");
    }

    const evm = evmAddress?.trim() || undefined;
    const solana = solanaAddress?.trim() || undefined;

    if (!evm && !solana) {
      throw new Error("Enter an EVM or Solana address");
    }

    if (evm && !EVM_ADDRESS.test(evm)) {
      throw new Error("Invalid EVM address");
    }

    if (solana && !SOLANA_ADDRESS.test(solana)) {
      throw new Error("Invalid Solana address");
    }

    if (evm) {
      const existingEvm = await ctx.db
        .query("contacts")
        .withIndex("by_owner_and_evm", (q) =>
          q.eq("ownerExternalId", ownerExternalId).eq("evmAddress", evm),
        )
        .unique();
      if (existingEvm) {
        await ctx.db.patch(existingEvm._id, {
          name: trimmedName,
          ...(solana && !existingEvm.solanaAddress
            ? { solanaAddress: solana }
            : {}),
        });
        return existingEvm._id;
      }
    }

    if (solana) {
      const existingSolana = await ctx.db
        .query("contacts")
        .withIndex("by_owner_and_solana", (q) =>
          q
            .eq("ownerExternalId", ownerExternalId)
            .eq("solanaAddress", solana),
        )
        .unique();
      if (existingSolana) {
        await ctx.db.patch(existingSolana._id, {
          name: trimmedName,
          ...(evm && !existingSolana.evmAddress ? { evmAddress: evm } : {}),
        });
        return existingSolana._id;
      }
    }

    return await ctx.db.insert("contacts", {
      ownerExternalId,
      name: trimmedName,
      evmAddress: evm,
      solanaAddress: solana,
    });
  },
});

/** Remove a contact owned by the signed-in Privy user. */
export const remove = mutation({
  args: {
    ownerExternalId: v.string(),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { ownerExternalId, contactId }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.ownerExternalId !== ownerExternalId) {
      throw new Error("Contact not found");
    }

    await ctx.db.delete(contactId);
  },
});
