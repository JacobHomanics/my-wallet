import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.optional(v.string()), // Privy DID (e.g. did:privy:...)
    username: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_username", ["username"]),
});
