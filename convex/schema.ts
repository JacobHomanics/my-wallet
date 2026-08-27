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
     * Auto-deposit received or onramped Base USDC into the earn vault. Defaults to on;
     * set explicitly to `false` to opt out.
     */
    autoDepositReceivedUsdc: v.optional(v.boolean()),
    /**
     * Withdraw vault USDC into the wallet before sending when payment legs
     * need Base USDC. Defaults to on; set explicitly to `false` to opt out.
     */
    useVaultUsdcWhenSending: v.optional(v.boolean()),
    /** Unix ms when the user joined the physical card waitlist. */
    physicalCardWaitlistJoinedAt: v.optional(v.number()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_username", ["username"])
    .index("by_identityId", ["identityId"]),

  contacts: defineTable({
    /** Convex `users` document id of the contact list owner. */
    ownerId: v.optional(v.id("users")),
  /** Set when the contact is a registered ZitiCashbox user. */
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

  /**
   * Link OAuth session for the headless Stripe onramp: maps an app user to
   * their Stripe crypto customer and the OAuth tokens minted for them.
   * Tokens are server-side only and are never returned to the client.
   */
  linkAuthSessions: defineTable({
    userId: v.id("users"),
    /** `crc_…` — from the SDK `authenticate()` completion callback. */
    cryptoCustomerId: v.string(),
    /** `lai_…` — kept so tokens can be refreshed against the same intent. */
    linkAuthIntentId: v.string(),
    /** Sent as the `Stripe-OAuth-Token` header. Never leaves the backend. */
    accessToken: v.string(),
    /** Absent when Link issued none: expiry then re-runs the auth intent flow. */
    refreshToken: v.optional(v.string()),
    /** Epoch ms. */
    accessTokenExpiresAt: v.number(),
    oauthScopes: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  /**
   * One row per headless onramp session, so Stripe's webhook — not the
   * browser — is what marks a deposit fulfilled.
   */
  headlessOnrampSessions: defineTable({
    userId: v.id("users"),
    /** `cos_…` */
    stripeSessionId: v.string(),
    /** initialized | requires_payment | fulfillment_processing | fulfillment_complete | rejected */
    status: v.string(),
    destinationCurrency: v.string(),
    destinationNetwork: v.string(),
    walletAddress: v.string(),
    sourceAmount: v.optional(v.string()),
    destinationAmount: v.optional(v.string()),
    /** Blockchain tx hash, set from the fulfillment webhook payload. */
    transactionId: v.optional(v.string()),
    /** Reason recorded when Stripe rejects the session. */
    failureReason: v.optional(v.string()),
    /**
     * Privy wallet id + pre-onramp Base USDC balance, captured at session
     * creation because the webhook has no browser context to ask for them.
     * Without these the auto-deposit pipeline cannot run server-side.
     */
    ethereumWalletId: v.optional(v.string()),
    priorBalanceRaw: v.optional(v.string()),
    /** One-shot guard so the vault auto-deposit runs exactly once. */
    autoDepositTriggered: v.boolean(),
    /** Outcome of that run, mirrored to the UI: deposited | skipped | failed | … */
    autoDepositStatus: v.optional(v.string()),
    autoDepositMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_session_id", ["stripeSessionId"])
    .index("by_user_id", ["userId"]),

  /** Webhook idempotency + audit trail, keyed on Stripe's `evt_…` id. */
  stripeWebhookEvents: defineTable({
    stripeEventId: v.string(),
    type: v.string(),
    payloadSessionId: v.optional(v.string()),
    processedAt: v.number(),
  }).index("by_stripe_event_id", ["stripeEventId"]),
});
