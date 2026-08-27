import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { CryptoCustomerState } from "./lib/cryptoCustomers";
import { fetchCryptoCustomerState } from "./lib/cryptoCustomers";
import {
  createLinkAuthIntent as createLinkAuthIntentRequest,
  exchangeLinkAuthTokens,
  getLinkOauthScopes,
  isAccessTokenExpired,
  refreshLinkAuthTokens,
} from "./lib/linkAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Link OAuth tokens live only in these internal functions. Public actions
 * return account *state* (KYC status, wallets, payment methods) and never the
 * tokens themselves, so a compromised client cannot replay a user's Link
 * session against Stripe.
 */

export const getSessionByUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("linkAuthSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const upsertSession = internalMutation({
  args: {
    userId: v.id("users"),
    cryptoCustomerId: v.string(),
    linkAuthIntentId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.number(),
    oauthScopes: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("linkAuthSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cryptoCustomerId: args.cryptoCustomerId,
        linkAuthIntentId: args.linkAuthIntentId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        oauthScopes: args.oauthScopes,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("linkAuthSessions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSessionTokens = internalMutation({
  args: {
    sessionId: v.id("linkAuthSessions"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...tokens } = args;
    await ctx.db.patch(sessionId, { ...tokens, updatedAt: Date.now() });
  },
});

export type ResolvedLinkSession = {
  cryptoCustomerId: string;
  accessToken: string;
};

/**
 * Resolve a usable Link access token for a user, refreshing it when it is at
 * or near expiry.
 *
 * Returns `null` — rather than throwing — when there is no session or the
 * refresh is rejected, because both mean the same recoverable thing to the
 * caller: send the user back through Link authentication.
 */
export const resolveSession = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<ResolvedLinkSession | null> => {
    const session = await ctx.runQuery(internal.linkAuth.getSessionByUser, {
      userId: args.userId,
    });
    if (!session) {
      return null;
    }

    if (!isAccessTokenExpired(session.accessTokenExpiresAt)) {
      return {
        cryptoCustomerId: session.cryptoCustomerId,
        accessToken: session.accessToken,
      };
    }

    // No refresh token means the session cannot outlive its access token; the
    // caller's recovery path is the same as a rejected refresh.
    const storedRefreshToken = session.refreshToken;
    if (!storedRefreshToken) {
      return null;
    }

    try {
      const tokens = await refreshLinkAuthTokens({
        refreshToken: storedRefreshToken,
      });
      await ctx.runMutation(internal.linkAuth.updateSessionTokens, {
        sessionId: session._id,
        accessToken: tokens.accessToken,
        // Refresh tokens roll, but keep the old one if none came back.
        refreshToken: tokens.refreshToken ?? storedRefreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      });
      return {
        cryptoCustomerId: session.cryptoCustomerId,
        accessToken: tokens.accessToken,
      };
    } catch (error) {
      console.error("[link-auth] token refresh failed", {
        userId: args.userId,
        error,
      });
      return null;
    }
  },
});

export type CreateLinkAuthIntentResult =
  | { status: "created"; linkAuthIntentId: string }
  | { status: "no_account" };

/**
 * Begin Link authentication for an email address.
 *
 * `no_account` is not an error: it tells the client to run the SDK's
 * `registerLinkUser` flow instead of `authenticate`.
 */
export const createLinkAuthIntent = action({
  args: { email: v.string() },
  handler: async (_ctx, args): Promise<CreateLinkAuthIntentResult> => {
    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    return await createLinkAuthIntentRequest({ email });
  },
});

/**
 * Exchange a consented Link auth intent for OAuth tokens and bind them to the
 * app user. Called once the SDK reports authentication succeeded.
 */
export const saveLinkAuthSession = action({
  args: {
    userId: v.id("users"),
    linkAuthIntentId: v.string(),
    cryptoCustomerId: v.string(),
  },
  handler: async (ctx, args): Promise<{ cryptoCustomerId: string }> => {
    const linkAuthIntentId = args.linkAuthIntentId.trim();
    const cryptoCustomerId = args.cryptoCustomerId.trim();
    if (!linkAuthIntentId || !cryptoCustomerId) {
      throw new Error("Link authentication did not return a usable session.");
    }

    const tokens = await exchangeLinkAuthTokens({ linkAuthIntentId });

    await ctx.runMutation(internal.linkAuth.upsertSession, {
      userId: args.userId,
      cryptoCustomerId,
      linkAuthIntentId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      oauthScopes: tokens.scopes || getLinkOauthScopes(),
    });

    return { cryptoCustomerId };
  },
});

export type OnrampCustomerState =
  | { status: "unauthenticated" }
  | { status: "authenticated"; customer: CryptoCustomerState };

/**
 * KYC status, registered wallets, and saved payment methods for the user's
 * Link account — the state the headless screen branches on.
 */
export const getCustomerState = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<OnrampCustomerState> => {
    const session: ResolvedLinkSession | null = await ctx.runAction(
      internal.linkAuth.resolveSession,
      { userId: args.userId },
    );
    if (!session) {
      return { status: "unauthenticated" };
    }

    const customer = await fetchCryptoCustomerState({
      cryptoCustomerId: session.cryptoCustomerId,
      oauthToken: session.accessToken,
    });

    return { status: "authenticated", customer };
  },
});

/** Forget a user's Link session (sign out of Link without touching Stripe). */
export const clearLinkAuthSession = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args: { userId: Id<"users"> }) => {
    const session = await ctx.db
      .query("linkAuthSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
