import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

type LegacyContact = {
  _id: Id<"contacts">;
  ownerId?: Id<"users">;
  ownerExternalId?: string;
  contactUserId?: Id<"users">;
  contactUsername?: string;
  name?: string;
  evmAddress?: string;
  solanaAddress?: string;
  farcasterFid?: number;
  farcasterUsername?: string;
  farcasterPfpUrl?: string;
};

/**
 * One-time cleanup: map legacy `ownerExternalId` → `ownerId` and drop
 * denormalized `contactUsername`.
 * Run with: npx convex run contacts:migrateOwnerIds
 */
export const migrateOwnerIds = mutation({
  args: {},
  handler: async (ctx) => {
    const contacts = (await ctx.db.query("contacts").collect()) as LegacyContact[];
    let updated = 0;
    let deleted = 0;

    for (const contact of contacts) {
      let ownerId = contact.ownerId;

      if (!ownerId && contact.ownerExternalId) {
        const ownerExternalId = contact.ownerExternalId;
        const owner = await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", ownerExternalId))
          .unique();
        ownerId = owner?._id;
      }

      if (!ownerId) {
        await ctx.db.delete(contact._id);
        deleted += 1;
        continue;
      }

      await ctx.db.replace(contact._id, {
        ownerId,
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
        ...(contact.farcasterFid !== undefined
          ? { farcasterFid: contact.farcasterFid }
          : {}),
        ...(contact.farcasterUsername !== undefined
          ? { farcasterUsername: contact.farcasterUsername }
          : {}),
        ...(contact.farcasterPfpUrl !== undefined
          ? { farcasterPfpUrl: contact.farcasterPfpUrl }
          : {}),
      });
      updated += 1;
    }

    return { updated, deleted };
  },
});

/** List contacts for the signed-in user. */
export const listForOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();

    return await Promise.all(
      contacts.map(async (contact) => {
        const isFarcaster = contact.farcasterFid != null;
        let username: string | null = null;
        let identityId: string | null = null;
        let profilePhotoUrl: string | null = null;

        if (contact.contactUserId) {
          const user = await ctx.db.get(contact.contactUserId);
          username = user?.username ?? null;
          identityId = user?.identityId ?? null;
          profilePhotoUrl = user?.profilePhotoId
            ? await ctx.storage.getUrl(user.profilePhotoId)
            : null;
        } else if (isFarcaster) {
          username = contact.farcasterUsername ?? null;
          profilePhotoUrl = contact.farcasterPfpUrl ?? null;
        }

        return {
          _id: contact._id,
          contactUserId: contact.contactUserId ?? null,
          name: contact.name ?? null,
          evmAddress: contact.evmAddress ?? null,
          solanaAddress: contact.solanaAddress ?? null,
          farcasterFid: contact.farcasterFid ?? null,
          farcasterUsername: contact.farcasterUsername ?? null,
          farcasterPfpUrl: contact.farcasterPfpUrl ?? null,
          username,
          identityId,
          profilePhotoUrl,
          isFarcaster,
          isExternal: !contact.contactUserId && !isFarcaster,
        };
      }),
    );
  },
});

/** Single contact for the signed-in user (null if missing or not owned). */
export const getForOwner = query({
  args: {
    ownerId: v.id("users"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { ownerId, contactId }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.ownerId !== ownerId) {
      return null;
    }

    const isFarcaster = contact.farcasterFid != null;
    let username: string | null = null;
    let identityId: string | null = null;
    let profilePhotoUrl: string | null = null;

    if (contact.contactUserId) {
      const user = await ctx.db.get(contact.contactUserId);
      username = user?.username ?? null;
      identityId = user?.identityId ?? null;
      profilePhotoUrl = user?.profilePhotoId
        ? await ctx.storage.getUrl(user.profilePhotoId)
        : null;
    } else if (isFarcaster) {
      username = contact.farcasterUsername ?? null;
      profilePhotoUrl = contact.farcasterPfpUrl ?? null;
    }

    return {
      _id: contact._id,
      contactUserId: contact.contactUserId ?? null,
      username,
      name: contact.name ?? null,
      evmAddress: contact.evmAddress ?? null,
      solanaAddress: contact.solanaAddress ?? null,
      farcasterFid: contact.farcasterFid ?? null,
      farcasterUsername: contact.farcasterUsername ?? null,
      farcasterPfpUrl: contact.farcasterPfpUrl ?? null,
      identityId,
      profilePhotoUrl,
      isFarcaster,
      isExternal: !contact.contactUserId && !isFarcaster,
    };
  },
});

/** Add a registered user to the owner's contacts list (idempotent). */
export const add = mutation({
  args: {
    ownerId: v.id("users"),
    contactUserId: v.id("users"),
  },
  handler: async (ctx, { ownerId, contactUserId }) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    const contactUser = await ctx.db.get(contactUserId);
    if (!contactUser) {
      throw new Error("User not found");
    }

    if (!contactUser.username && !contactUser.identityId) {
      throw new Error("User has no username or account number");
    }

    if (contactUserId === ownerId) {
      throw new Error("You can't add yourself as a contact");
    }

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_contact", (q) =>
        q.eq("ownerId", ownerId).eq("contactUserId", contactUserId),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerId,
      contactUserId,
    });
  },
});

/** Add a contact by EVM and/or Solana address (idempotent). */
export const addByAddresses = mutation({
  args: {
    ownerId: v.id("users"),
    name: v.string(),
    evmAddress: v.optional(v.string()),
    solanaAddress: v.optional(v.string()),
  },
  handler: async (ctx, { ownerId, name, evmAddress, solanaAddress }) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

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
          q.eq("ownerId", ownerId).eq("evmAddress", evm),
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
          q.eq("ownerId", ownerId).eq("solanaAddress", solana),
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
      ownerId,
      name: trimmedName,
      evmAddress: evm,
      solanaAddress: solana,
    });
  },
});

/** Add a Farcaster contact by FID (idempotent; refreshes username/pfp/addresses). */
export const addByFarcaster = mutation({
  args: {
    ownerId: v.id("users"),
    farcasterFid: v.number(),
    farcasterUsername: v.string(),
    farcasterPfpUrl: v.optional(v.string()),
    name: v.optional(v.string()),
    evmAddress: v.optional(v.string()),
    solanaAddress: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      ownerId,
      farcasterFid,
      farcasterUsername,
      farcasterPfpUrl,
      name,
      evmAddress,
      solanaAddress,
    },
  ) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    if (!Number.isInteger(farcasterFid) || farcasterFid < 0) {
      throw new Error("Invalid Farcaster FID");
    }

    const username = farcasterUsername.trim().replace(/^@/, "");
    if (!username) {
      throw new Error("Enter a Farcaster username");
    }

    const evm = evmAddress?.trim() || undefined;
    const solana = solanaAddress?.trim() || undefined;

    if (!evm && !solana) {
      throw new Error("Farcaster user has no verified addresses");
    }

    if (evm && !EVM_ADDRESS.test(evm)) {
      throw new Error("Invalid EVM address");
    }

    if (solana && !SOLANA_ADDRESS.test(solana)) {
      throw new Error("Invalid Solana address");
    }

    const trimmedName = name?.trim() || undefined;
    const pfpUrl = farcasterPfpUrl?.trim() || undefined;

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_fid", (q) =>
        q.eq("ownerId", ownerId).eq("farcasterFid", farcasterFid),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        farcasterUsername: username,
        ...(pfpUrl !== undefined ? { farcasterPfpUrl: pfpUrl } : {}),
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
        ...(evm ? { evmAddress: evm } : {}),
        ...(solana ? { solanaAddress: solana } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerId,
      farcasterFid,
      farcasterUsername: username,
      ...(pfpUrl ? { farcasterPfpUrl: pfpUrl } : {}),
      ...(trimmedName ? { name: trimmedName } : {}),
      ...(evm ? { evmAddress: evm } : {}),
      ...(solana ? { solanaAddress: solana } : {}),
    });
  },
});

/** Remove a contact owned by the signed-in user. */
export const remove = mutation({
  args: {
    ownerId: v.id("users"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { ownerId, contactId }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.ownerId !== ownerId) {
      throw new Error("Contact not found");
    }

    await ctx.db.delete(contactId);
  },
});
