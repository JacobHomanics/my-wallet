/**
 * Link OAuth client for the headless Stripe onramp.
 *
 * Link — not Stripe's core API — owns the end-user identity here. The browser
 * only ever sees a `LinkAuthIntent` id; the resulting access/refresh tokens are
 * exchanged and held on the server, then replayed as `Stripe-OAuth-Token` on
 * every `/v1/crypto/customers/*` call.
 */

import { getStripeSecretKey } from "./stripeCrypto";

const LINK_API_BASE = "https://login.link.com";
const LINK_AUTH_INTENT_PATH = "/v1/link_auth_intent";
/** Refresh lives on the OAuth token endpoint, not under the auth intent. */
const LINK_TOKEN_PATH = "/auth/token";

/** Minimum scopes the headless flow needs: create ramps + read KYC status. */
const DEFAULT_LINK_OAUTH_SCOPES = "crypto:ramp,kyc.status:read";

/** Refresh a little early so an in-flight checkout never races expiry. */
const TOKEN_EXPIRY_SKEW_MS = 60_000;

function getLinkOauthClientId(): string {
  const value = process.env.LINK_OAUTH_CLIENT_ID?.trim();
  if (!value) {
    throw new Error(
      "Missing LINK_OAUTH_CLIENT_ID — set it with `npx convex env set LINK_OAUTH_CLIENT_ID …`",
    );
  }
  return value;
}

/**
 * Used only by the refresh grant on `/auth/token`, which is the one place Link
 * asks for OAuth client credentials. The auth-intent endpoints authenticate
 * with the Stripe secret key instead and reject this value outright.
 */
function getLinkOauthClientSecret(): string {
  const value = process.env.LINK_OAUTH_CLIENT_SECRET?.trim();
  if (!value) {
    throw new Error(
      "Missing LINK_OAUTH_CLIENT_SECRET — set it with `npx convex env set LINK_OAUTH_CLIENT_SECRET …`",
    );
  }
  return value;
}

export function getLinkOauthScopes(): string {
  return process.env.LINK_OAUTH_SCOPES?.trim() || DEFAULT_LINK_OAUTH_SCOPES;
}

type LinkAuthIntentResponse = {
  id?: string;
  error?: { message?: string };
};

type LinkTokenResponse = {
  access_token?: string;
  /**
   * The auth-intent exchange nests the refresh token; `/auth/token` returns it
   * at the top level. Either may be absent — the guide documents the refresh
   * token as issued only sometimes.
   */
  refresh?: { refresh_token?: string; expires_in?: number };
  refresh_token?: string;
  /** Seconds until the access token expires. */
  expires_in?: number;
  /** Space-separated on the exchange response, comma-separated on refresh. */
  scope?: string;
  error?: { message?: string };
  error_description?: string;
};

export type LinkAuthIntentResult =
  | { status: "created"; linkAuthIntentId: string }
  /** Link has no consumer account for this email — register the user instead. */
  | { status: "no_account" };

export type LinkTokens = {
  accessToken: string;
  /**
   * Absent when Link issued no refresh token. The session then lives only as
   * long as its access token: expiry sends the user back through the auth
   * intent flow instead of a refresh.
   */
  refreshToken?: string;
  /** Epoch ms. */
  accessTokenExpiresAt: number;
  scopes: string;
};

/**
 * Link's OAuth endpoints authenticate with the Stripe secret key and take JSON.
 * Verified live against `login.link.com`: an `lwlsk_` OAuth client secret as
 * Bearer returns 401 Invalid API Key, and a form-encoded body is rejected by
 * the parser even when the key is right.
 */
async function linkRequest<T>(
  path: string,
  body?: Record<string, string>,
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`${LINK_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as T;
  return { ok: response.ok, status: response.status, data };
}

/**
 * The refresh grant is a plain OAuth call: form-encoded, and the only Link
 * endpoint that takes the OAuth client id/secret pair.
 */
async function linkFormRequest<T>(
  path: string,
  body: Record<string, string>,
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`${LINK_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = (await response.json()) as T;
  return { ok: response.ok, status: response.status, data };
}

/**
 * Start Link authentication for an email address.
 *
 * A 404 is a documented, expected outcome: Link has no account for that email,
 * so the client must run `registerLinkUser` rather than `authenticate`.
 */
export async function createLinkAuthIntent(params: {
  email: string;
}): Promise<LinkAuthIntentResult> {
  const response = await linkRequest<LinkAuthIntentResponse>(
    LINK_AUTH_INTENT_PATH,
    {
      email: params.email,
      oauth_client_id: getLinkOauthClientId(),
      // A string, not an array: Link rejects arrays with `oauth_scopes must be
      // a string`.
      oauth_scopes: getLinkOauthScopes(),
    },
  );

  if (response.status === 404) {
    return { status: "no_account" };
  }
  if (!response.ok || !response.data.id) {
    throw new Error(
      response.data.error?.message ??
        `Link auth intent failed (${response.status})`,
    );
  }

  return { status: "created", linkAuthIntentId: response.data.id };
}

function toLinkTokens(data: LinkTokenResponse, fallbackScopes: string): LinkTokens {
  if (!data.access_token) {
    throw new Error(
      data.error?.message ??
        data.error_description ??
        "Link token response was missing an access token.",
    );
  }
  // Treat a missing expires_in as already-expired so the next call refreshes
  // rather than sending a token we cannot reason about.
  const expiresInMs = (data.expires_in ?? 0) * 1000;
  return {
    accessToken: data.access_token,
    // Nested on the auth-intent exchange, top-level on the refresh grant.
    refreshToken: data.refresh?.refresh_token ?? data.refresh_token,
    accessTokenExpiresAt: Date.now() + expiresInMs,
    scopes: data.scope ?? fallbackScopes,
  };
}

/**
 * Exchange a consented `LinkAuthIntent` for the user's OAuth tokens.
 */
export async function exchangeLinkAuthTokens(params: {
  linkAuthIntentId: string;
}): Promise<LinkTokens> {
  // Documented as a bodyless POST: the intent id in the path is the whole ask.
  const response = await linkRequest<LinkTokenResponse>(
    `${LINK_AUTH_INTENT_PATH}/${encodeURIComponent(params.linkAuthIntentId)}/tokens`,
  );

  if (!response.ok) {
    throw new Error(
      response.data.error?.message ??
        response.data.error_description ??
        `Link token exchange failed (${response.status})`,
    );
  }

  return toLinkTokens(response.data, getLinkOauthScopes());
}

/**
 * Mint a fresh access token from a stored refresh token.
 *
 * Callers must treat failure as recoverable rather than fatal: re-running the
 * full auth intent flow always works, so a rejected refresh sends the user back
 * through `authenticate` instead of dead-ending the deposit.
 */
export async function refreshLinkAuthTokens(params: {
  refreshToken: string;
}): Promise<LinkTokens> {
  const response = await linkFormRequest<LinkTokenResponse>(LINK_TOKEN_PATH, {
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: getLinkOauthClientId(),
    client_secret: getLinkOauthClientSecret(),
  });

  if (!response.ok) {
    throw new Error(
      response.data.error?.message ??
        response.data.error_description ??
        `Link token refresh failed (${response.status})`,
    );
  }

  return toLinkTokens(response.data, getLinkOauthScopes());
}

export function isAccessTokenExpired(accessTokenExpiresAt: number): boolean {
  return Date.now() >= accessTokenExpiresAt - TOKEN_EXPIRY_SKEW_MS;
}
