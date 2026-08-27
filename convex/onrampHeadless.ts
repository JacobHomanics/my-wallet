import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action, internalMutation, internalQuery } from "./_generated/server";
import type {
  HeadlessOnrampQuote,
  HeadlessOnrampSession,
} from "./lib/headlessOnramp";
import {
  checkoutHeadlessOnrampSession,
  createHeadlessOnrampSession as createStripeHeadlessSession,
  retrieveHeadlessOnrampSession,
} from "./lib/headlessOnramp";
import type { ResolvedLinkSession } from "./linkAuth";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const DEFAULT_DESTINATION_CURRENCY = "usdc";
const DEFAULT_DESTINATION_NETWORK = "base";
const DEFAULT_SOURCE_CURRENCY = "usd";

function assertPositiveAmount(sourceAmount: string): string {
  const trimmed = sourceAmount.trim();
  const parsed = Number(trimmed);
  if (!trimmed || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }
  return trimmed;
}

function assertEvmAddress(walletAddress: string): string {
  const trimmed = walletAddress.trim();
  if (!EVM_ADDRESS_RE.test(trimmed)) {
    throw new Error("Invalid EVM wallet address.");
  }
  return trimmed;
}

export const getSessionByStripeId = internalQuery({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("headlessOnrampSessions")
      .withIndex("by_stripe_session_id", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId),
      )
      .unique();
  },
});

export const recordSession = internalMutation({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
    status: v.string(),
    destinationCurrency: v.string(),
    destinationNetwork: v.string(),
    walletAddress: v.string(),
    sourceAmount: v.optional(v.string()),
    destinationAmount: v.optional(v.string()),
    ethereumWalletId: v.optional(v.string()),
    priorBalanceRaw: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("headlessOnrampSessions")
      .withIndex("by_stripe_session_id", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("headlessOnrampSessions", {
      ...args,
      autoDepositTriggered: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const patchSessionStatus = internalMutation({
  args: {
    stripeSessionId: v.string(),
    status: v.string(),
    destinationAmount: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { stripeSessionId, ...patch } = args;
    const session = await ctx.db
      .query("headlessOnrampSessions")
      .withIndex("by_stripe_session_id", (q) =>
        q.eq("stripeSessionId", stripeSessionId),
      )
      .unique();
    if (!session) {
      return;
    }
    await ctx.db.patch(session._id, { ...patch, updatedAt: Date.now() });
  },
});

/**
 * Load a session row and prove it belongs to the caller.
 *
 * Every client-facing action funnels through this: the Stripe session id is
 * guessable-adjacent and the Link OAuth token is not the client's to wield, so
 * ownership is checked before any Stripe call is made on the user's behalf.
 */
async function requireOwnedSession(
  ctx: ActionCtx,
  params: { userId: Doc<"users">["_id"]; stripeSessionId: string },
): Promise<Doc<"headlessOnrampSessions">> {
  const session = await ctx.runQuery(
    internal.onrampHeadless.getSessionByStripeId,
    { stripeSessionId: params.stripeSessionId },
  );
  if (!session || session.userId !== params.userId) {
    throw new Error("Deposit session not found.");
  }
  return session;
}

async function requireLinkSession(
  ctx: ActionCtx,
  userId: Doc<"users">["_id"],
): Promise<ResolvedLinkSession> {
  const linkSession: ResolvedLinkSession | null = await ctx.runAction(
    internal.linkAuth.resolveSession,
    { userId },
  );
  if (!linkSession) {
    throw new Error("Sign in with Link to continue.");
  }
  return linkSession;
}

export type HeadlessSessionResult = {
  stripeSessionId: string;
  clientSecret: string;
  status: string;
  quote: HeadlessOnrampQuote | null;
  destinationAmount: string | null;
};

function toResult(session: HeadlessOnrampSession): HeadlessSessionResult {
  return {
    stripeSessionId: session.id,
    clientSecret: session.clientSecret,
    status: session.status,
    quote: session.quote,
    destinationAmount: session.destinationAmount,
  };
}

/**
 * Create a headless onramp session and mirror it into Convex.
 *
 * `ethereumWalletId` and `priorBalanceRaw` are captured here because the
 * fulfillment webhook runs with no browser context: without them recorded up
 * front, the auto-deposit pipeline has no wallet to move funds from.
 */
export const createSession = action({
  args: {
    userId: v.id("users"),
    walletAddress: v.string(),
    sourceAmount: v.string(),
    sourceCurrency: v.optional(v.string()),
    destinationCurrency: v.optional(v.string()),
    destinationNetwork: v.optional(v.string()),
    ethereumWalletId: v.optional(v.string()),
    priorBalanceRaw: v.optional(v.string()),
    customerIpAddress: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<HeadlessSessionResult> => {
    const walletAddress = assertEvmAddress(args.walletAddress);
    const sourceAmount = assertPositiveAmount(args.sourceAmount);
    const linkSession = await requireLinkSession(ctx, args.userId);

    const destinationCurrency =
      args.destinationCurrency?.trim().toLowerCase() ||
      DEFAULT_DESTINATION_CURRENCY;
    const destinationNetwork =
      args.destinationNetwork?.trim().toLowerCase() ||
      DEFAULT_DESTINATION_NETWORK;

    const session = await createStripeHeadlessSession({
      oauthToken: linkSession.accessToken,
      walletAddress,
      destinationCurrency,
      destinationNetwork,
      sourceAmount,
      sourceCurrency:
        args.sourceCurrency?.trim().toLowerCase() || DEFAULT_SOURCE_CURRENCY,
      customerIpAddress: args.customerIpAddress,
    });

    await ctx.runMutation(internal.onrampHeadless.recordSession, {
      userId: args.userId,
      stripeSessionId: session.id,
      status: session.status,
      destinationCurrency,
      destinationNetwork,
      walletAddress,
      sourceAmount,
      destinationAmount: session.destinationAmount ?? undefined,
      ethereumWalletId: args.ethereumWalletId?.trim() || undefined,
      priorBalanceRaw: args.priorBalanceRaw?.trim() || undefined,
    });

    return toResult(session);
  },
});

/**
 * Re-read the session from Stripe so the user confirms against a live quote
 * rather than one that expired while they were reading it.
 */
export const refreshQuote = action({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args): Promise<HeadlessSessionResult> => {
    await requireOwnedSession(ctx, args);
    const linkSession = await requireLinkSession(ctx, args.userId);

    const session = await retrieveHeadlessOnrampSession({
      oauthToken: linkSession.accessToken,
      sessionId: args.stripeSessionId,
    });

    await ctx.runMutation(internal.onrampHeadless.patchSessionStatus, {
      stripeSessionId: session.id,
      status: session.status,
      destinationAmount: session.destinationAmount ?? undefined,
      transactionId: session.transactionId ?? undefined,
    });

    return toResult(session);
  },
});

/**
 * Confirm the purchase.
 *
 * The Convex row is updated from Stripe's checkout response, but fulfillment
 * itself is only ever recorded by the webhook — a client that closes the tab
 * mid-flight must not lose (or fake) a completed deposit.
 */
export const checkoutSession = action({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
    paymentTokenId: v.string(),
    /** Required for ACH; Stripe ignores it for cards. */
    mandate: v.optional(
      v.object({ ipAddress: v.string(), userAgent: v.string() }),
    ),
  },
  handler: async (ctx, args): Promise<HeadlessSessionResult> => {
    await requireOwnedSession(ctx, args);
    const linkSession = await requireLinkSession(ctx, args.userId);

    const paymentTokenId = args.paymentTokenId.trim();
    if (!paymentTokenId) {
      throw new Error("Select a payment method to continue.");
    }

    const session = await checkoutHeadlessOnrampSession({
      oauthToken: linkSession.accessToken,
      sessionId: args.stripeSessionId,
      paymentTokenId,
      mandateData: args.mandate,
      // Replays of the same confirmation must not charge the user twice.
      idempotencyKey: `checkout:${args.stripeSessionId}`,
    });

    await ctx.runMutation(internal.onrampHeadless.patchSessionStatus, {
      stripeSessionId: session.id,
      status: session.status,
      destinationAmount: session.destinationAmount ?? undefined,
      transactionId: session.transactionId ?? undefined,
    });

    return toResult(session);
  },
});
