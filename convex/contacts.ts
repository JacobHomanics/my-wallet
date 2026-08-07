import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * One-time cleanup: rewrite contacts without legacy `contactUsername`.
 * Run with: npx convex run contacts:stripLegacyContactUsernames
 */
export const stripLegacyContactUsernames = mutation({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    let updated = 0;

    for (const contact of contacts) {
      const legacy = contact as typeof contact & {
        contactUsername?: string;
      };
      if (legacy.contactUsername === undefined) {
        continue;
      }

      await ctx.db.replace(contact._id, {
        ownerExternalId: contact.ownerExternalId,
        ...(contact.contactUserId
          ? { contactUserId: contact.contactUserId }
          : {}),
        ...(contact.name !== undefined ? { name: contact.name } : {}),
        ...(contact.evmAddress !== undefined
          ? { evmAddress: contact.evmAddress }
          : {}),
        ...(contact.solanaAddress !== undefined
          ? { solanaAddress: contact.solanaAddress }
          : {}),
      });
      updated += 1;
    }

    return { updated };
  },
});

/** List contacts for the signed-in Privy user. */
export const listForOwner = query({
  args: { ownerExternalId: v.string() },
  handler: async (ctx, { ownerExternalId }) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_owner", (q) => q.eq("ownerExternalId", ownerExternalId))
      .collect();

    return await Promise.all(
      contacts.map(async (contact) => {
        let username: string | null = null;
        let identityId: string | null = null;

        if (contact.contactUserId) {
          const user = await ctx.db.get(contact.contactUserId);
          username = user?.username ?? null;
          identityId = user?.identityId ?? null;
        }

        return {
          _id: contact._id,
          contactUserId: contact.contactUserId ?? null,
          name: contact.name ?? null,
          evmAddress: contact.evmAddress ?? null,
          solanaAddress: contact.solanaAddress ?? null,
          username,
          identityId,
          isExternal: !contact.contactUserId,
        };
      }),
    );
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

    let username: string | null = null;
    let identityId: string | null = null;

    if (contact.contactUserId) {
      const user = await ctx.db.get(contact.contactUserId);
      username = user?.username ?? null;
      identityId = user?.identityId ?? null;
    }

    return {
      _id: contact._id,
      contactUserId: contact.contactUserId ?? null,
      username,
      name: contact.name ?? null,
      evmAddress: contact.evmAddress ?? null,
      solanaAddress: contact.solanaAddress ?? null,
      identityId,
      isExternal: !contact.contactUserId,
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

    if (!contactUser.username && !contactUser.identityId) {
      throw new Error("User has no username or account number");
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
