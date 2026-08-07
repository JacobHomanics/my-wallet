import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.optional(v.string()), // Privy DID (e.g. did:privy:...)
    username: v.optional(v.string()),
    /** Reversible wallet identity / account number (EVM + Solana). */
    identityId: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_username", ["username"])
    .index("by_identityId", ["identityId"]),

  contacts: defineTable({
    ownerExternalId: v.string(),
    /** Set when the contact is a registered Cashbox user. */
    contactUserId: v.optional(v.id("users")),
    /** Display name for address-book / advanced contacts. */
    name: v.optional(v.string()),
    /** Optional chain addresses for address-book / advanced contacts. */
    evmAddress: v.optional(v.string()),
    solanaAddress: v.optional(v.string()),
  })
    .index("by_owner", ["ownerExternalId"])
    .index("by_owner_and_contact", ["ownerExternalId", "contactUserId"])
    .index("by_owner_and_evm", ["ownerExternalId", "evmAddress"])
    .index("by_owner_and_solana", ["ownerExternalId", "solanaAddress"]),
});
