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
    contactUserId: v.id("users"),
    contactUsername: v.string(),
  })
    .index("by_owner", ["ownerExternalId"])
    .index("by_owner_and_contact", ["ownerExternalId", "contactUserId"]),
});
