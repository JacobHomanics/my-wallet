import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.optional(v.string()), // Privy DID (e.g. did:privy:...)
    username: v.optional(v.string()),
    /** Reversible wallet identity / account number (EVM + Solana). */
    identityId: v.optional(v.string()),
    /** Profile photo stored in Convex file storage. */
    profilePhotoId: v.optional(v.id("_storage")),
    /**
     * Explicit `true` after the user finishes or skips onboarding.
     * Missing/`false` means onboarding is still required.
     */
    onboardingCompleted: v.optional(v.boolean()),
    /**
     * Auto-deposit received Base USDC into the earn vault. Defaults to on;
     * set explicitly to `false` to opt out.
     */
    autoDepositReceivedUsdc: v.optional(v.boolean()),
    /**
     * Withdraw vault USDC into the wallet before sending when payment legs
     * need Base USDC. Defaults to on; set explicitly to `false` to opt out.
     */
    useVaultUsdcWhenSending: v.optional(v.boolean()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_username", ["username"])
    .index("by_identityId", ["identityId"]),

  contacts: defineTable({
    /** Convex `users` document id of the contact list owner. */
    ownerId: v.optional(v.id("users")),
    /** Set when the contact is a registered Cashbox user. */
    contactUserId: v.optional(v.id("users")),
    /** Display name for address-book / advanced contacts. */
    name: v.optional(v.string()),
    /** Optional chain addresses for address-book / advanced contacts. */
    evmAddress: v.optional(v.string()),
    solanaAddress: v.optional(v.string()),
    /** Farcaster FID when this is a first-class Farcaster contact. */
    farcasterFid: v.optional(v.number()),
    /** Farcaster username (without @). */
    farcasterUsername: v.optional(v.string()),
    /** Farcaster profile picture URL. */
    farcasterPfpUrl: v.optional(v.string()),
    /** ENS name when this is a first-class ENS contact (e.g. vitalik.eth). */
    ensName: v.optional(v.string()),
    /** Resolved ENS avatar URL from the avatar text record. */
    ensAvatarUrl: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_contact", ["ownerId", "contactUserId"])
    .index("by_owner_and_evm", ["ownerId", "evmAddress"])
    .index("by_owner_and_solana", ["ownerId", "solanaAddress"])
    .index("by_owner_and_fid", ["ownerId", "farcasterFid"])
    .index("by_owner_and_ens", ["ownerId", "ensName"]),
});
