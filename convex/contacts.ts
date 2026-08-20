import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getContactIdentityView } from "./lib/contactIdentity";

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
  ensName?: string;
  ensAvatarUrl?: string;
  basename?: string;
  basenameAvatarUrl?: string;
  lensAccount?: string;
  lensHandle?: string;
  lensAvatarUrl?: string;
  snsDomain?: string;
  nostrNip05?: string;
  nostrPubkey?: string;
  nostrAvatarUrl?: string;
};

type ContactQueryCtx = {
  db: {
    get: (
      id: Id<"users">,
    ) => Promise<
      | {
          username?: string;
          identityId?: string;
          profilePhotoId?: Id<"_storage">;
        }
      | null
    >;
  };
  storage: {
    getUrl: (id: Id<"_storage">) => Promise<string | null>;
  };
};

async function mapContactForOwner(ctx: ContactQueryCtx, contact: Doc<"contacts">) {
  let userProfile:
    | {
        username: string | null;
        identityId: string | null;
        profilePhotoUrl: string | null;
      }
    | undefined;

  if (contact.contactUserId) {
    const user = await ctx.db.get(contact.contactUserId);
    userProfile = {
      username: user?.username ?? null,
      identityId: user?.identityId ?? null,
      profilePhotoUrl: user?.profilePhotoId
        ? await ctx.storage.getUrl(user.profilePhotoId)
        : null,
    };
  }

  const identity = getContactIdentityView(contact, userProfile);

  return {
    _id: contact._id,
    contactUserId: contact.contactUserId ?? null,
    name: contact.name ?? null,
    evmAddress: contact.evmAddress ?? null,
    solanaAddress: contact.solanaAddress ?? null,
    farcasterFid: contact.farcasterFid ?? null,
    farcasterUsername: contact.farcasterUsername ?? null,
    farcasterPfpUrl: contact.farcasterPfpUrl ?? null,
    ensName: contact.ensName ?? null,
    ensAvatarUrl: contact.ensAvatarUrl ?? null,
    basename: contact.basename ?? null,
    basenameAvatarUrl: contact.basenameAvatarUrl ?? null,
    lensAccount: contact.lensAccount ?? null,
    lensHandle: contact.lensHandle ?? null,
    lensAvatarUrl: contact.lensAvatarUrl ?? null,
    snsDomain: contact.snsDomain ?? null,
    nostrNip05: contact.nostrNip05 ?? null,
    nostrPubkey: contact.nostrPubkey ?? null,
    nostrAvatarUrl: contact.nostrAvatarUrl ?? null,
    username: identity.username,
    identityId: userProfile?.identityId ?? null,
    profilePhotoUrl: identity.profilePhotoUrl,
    isFarcaster: identity.isFarcaster,
    isEns: identity.isEns,
    isBasename: identity.isBasename,
    isLens: identity.isLens,
    isSns: identity.isSns,
    isNostr: identity.isNostr,
    isExternal: identity.isExternal,
  };
}

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
        ...(contact.ensName !== undefined ? { ensName: contact.ensName } : {}),
        ...(contact.ensAvatarUrl !== undefined
          ? { ensAvatarUrl: contact.ensAvatarUrl }
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
      contacts.map(async (contact) => mapContactForOwner(ctx, contact)),
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

    return await mapContactForOwner(ctx, contact);
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

/** Add a contact by EVM and/or Solana address. */
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

    return await ctx.db.insert("contacts", {
      ownerId,
      ...(trimmedName ? { name: trimmedName } : {}),
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

/** Add an ENS contact by name (idempotent; refreshes resolved EVM address). */
export const addByEns = mutation({
  args: {
    ownerId: v.id("users"),
    ensName: v.string(),
    evmAddress: v.string(),
    ensAvatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { ownerId, ensName, evmAddress, ensAvatarUrl }) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    const name = ensName.trim().toLowerCase();
    if (!name.includes(".")) {
      throw new Error("Enter a valid ENS name");
    }

    const evm = evmAddress.trim();
    if (!EVM_ADDRESS.test(evm)) {
      throw new Error("Invalid EVM address");
    }

    const avatarUrl = ensAvatarUrl?.trim() || undefined;

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_ens", (q) =>
        q.eq("ownerId", ownerId).eq("ensName", name),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ensName: name,
        evmAddress: evm,
        name,
        ...(avatarUrl !== undefined ? { ensAvatarUrl: avatarUrl } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerId,
      ensName: name,
      evmAddress: evm,
      name,
      ...(avatarUrl ? { ensAvatarUrl: avatarUrl } : {}),
    });
  },
});

/** Add a Basename contact (idempotent). */
export const addByBasename = mutation({
  args: {
    ownerId: v.id("users"),
    basename: v.string(),
    evmAddress: v.string(),
    basenameAvatarUrl: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { ownerId, basename, evmAddress, basenameAvatarUrl, name },
  ) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) throw new Error("Owner not found");

    const normalized = basename.trim().toLowerCase();
    if (!normalized.endsWith(".base.eth")) {
      throw new Error("Enter a valid Basename");
    }

    const evm = evmAddress.trim();
    if (!EVM_ADDRESS.test(evm)) throw new Error("Invalid EVM address");

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_basename", (q) =>
        q.eq("ownerId", ownerId).eq("basename", normalized),
      )
      .unique();

    const avatarUrl = basenameAvatarUrl?.trim() || undefined;
    const trimmedName = name?.trim() || undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        basename: normalized,
        evmAddress: evm,
        ...(avatarUrl !== undefined ? { basenameAvatarUrl: avatarUrl } : {}),
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerId,
      basename: normalized,
      evmAddress: evm,
      ...(avatarUrl ? { basenameAvatarUrl: avatarUrl } : {}),
      ...(trimmedName ? { name: trimmedName } : {}),
    });
  },
});

/** Add a Lens contact (idempotent). */
export const addByLens = mutation({
  args: {
    ownerId: v.id("users"),
    lensAccount: v.string(),
    lensHandle: v.string(),
    evmAddress: v.string(),
    lensAvatarUrl: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { ownerId, lensAccount, lensHandle, evmAddress, lensAvatarUrl, name },
  ) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) throw new Error("Owner not found");

    const account = lensAccount.trim().toLowerCase();
    const handle = lensHandle.trim().replace(/^@/, "").replace(/^lens\//i, "");
    if (!EVM_ADDRESS.test(account)) throw new Error("Invalid Lens account");
    if (!handle) throw new Error("Enter a Lens handle");

    const evm = evmAddress.trim();
    if (!EVM_ADDRESS.test(evm)) throw new Error("Invalid EVM address");

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_lens_account", (q) =>
        q.eq("ownerId", ownerId).eq("lensAccount", account),
      )
      .unique();

    const avatarUrl = lensAvatarUrl?.trim() || undefined;
    const trimmedName = name?.trim() || undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        lensHandle: handle,
        ...(avatarUrl !== undefined ? { lensAvatarUrl: avatarUrl } : {}),
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
        evmAddress: evm,
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerId,
      lensAccount: account,
      lensHandle: handle,
      evmAddress: evm,
      ...(avatarUrl ? { lensAvatarUrl: avatarUrl } : {}),
      ...(trimmedName ? { name: trimmedName } : {}),
    });
  },
});

/** Add an SNS domain contact (idempotent). */
export const addBySns = mutation({
  args: {
    ownerId: v.id("users"),
    snsDomain: v.string(),
    solanaAddress: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { ownerId, snsDomain, solanaAddress, name }) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) throw new Error("Owner not found");

    const domain = snsDomain.trim().toLowerCase();
    if (!domain.endsWith(".sol") && !domain.endsWith(".sns")) {
      throw new Error("Enter a valid .sol domain");
    }

    const solana = solanaAddress.trim();
    if (!SOLANA_ADDRESS.test(solana)) throw new Error("Invalid Solana address");

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_sns_domain", (q) =>
        q.eq("ownerId", ownerId).eq("snsDomain", domain),
      )
      .unique();

    const trimmedName = name?.trim() || undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        snsDomain: domain,
        solanaAddress: solana,
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerId,
      snsDomain: domain,
      solanaAddress: solana,
      ...(trimmedName ? { name: trimmedName } : {}),
    });
  },
});

/** Add a Nostr NIP-05 contact (idempotent). */
export const addByNostr = mutation({
  args: {
    ownerId: v.id("users"),
    nostrNip05: v.string(),
    nostrPubkey: v.string(),
    evmAddress: v.optional(v.string()),
    nostrAvatarUrl: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { ownerId, nostrNip05, nostrPubkey, evmAddress, nostrAvatarUrl, name },
  ) => {
    const owner = await ctx.db.get(ownerId);
    if (!owner) throw new Error("Owner not found");

    const nip05 = nostrNip05.trim().toLowerCase();
    const pubkey = nostrPubkey.trim().toLowerCase();
    if (!nip05.includes("@")) throw new Error("Enter a valid NIP-05 id");
    if (!/^[0-9a-f]{64}$/.test(pubkey)) throw new Error("Invalid Nostr pubkey");

    const evm = evmAddress?.trim() || undefined;
    const solana = undefined;
    if (!evm && !solana) {
      throw new Error("Nostr profile has no sendable wallet address");
    }
    if (evm && !EVM_ADDRESS.test(evm)) throw new Error("Invalid EVM address");

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_owner_and_nostr_pubkey", (q) =>
        q.eq("ownerId", ownerId).eq("nostrPubkey", pubkey),
      )
      .unique();

    const avatarUrl = nostrAvatarUrl?.trim() || undefined;
    const trimmedName = name?.trim() || undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        nostrNip05: nip05,
        ...(avatarUrl !== undefined ? { nostrAvatarUrl: avatarUrl } : {}),
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
        ...(evm ? { evmAddress: evm } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      ownerId,
      nostrNip05: nip05,
      nostrPubkey: pubkey,
      ...(avatarUrl ? { nostrAvatarUrl: avatarUrl } : {}),
      ...(trimmedName ? { name: trimmedName } : {}),
      ...(evm ? { evmAddress: evm } : {}),
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
