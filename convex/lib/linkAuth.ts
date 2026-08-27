/**
 * Link OAuth client for the headless Stripe onramp.
 *
 * Link — not Stripe's core API — owns the end-user identity here. The browser
 * only ever sees a `LinkAuthIntent` id; the resulting access/refresh tokens are
 * exchanged and held on the server, then replayed as `Stripe-OAuth-Token` on
 * every `/v1/crypto/customers/*` call.
 */

const LINK_API_BASE = "https://login.link.com";
const LINK_AUTH_INTENT_PATH = "/v1/link_auth_intent";

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
  refresh_token?: string;
  /** Seconds until the access token expires. */
  expires_in?: number;
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
  refreshToken: string;
  /** Epoch ms. */
  accessTokenExpiresAt: number;
  scopes: string;
};

async function linkRequest<T>(
  path: string,
  body: URLSearchParams,
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`${LINK_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getLinkOauthClientSecret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
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
  const body = new URLSearchParams();
  body.set("email", params.email);
  body.set("oauth_client_id", getLinkOauthClientId());
  body.set("oauth_scopes", getLinkOauthScopes());

  const response = await linkRequest<LinkAuthIntentResponse>(
    LINK_AUTH_INTENT_PATH,
    body,
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
  if (!data.access_token || !data.refresh_token) {
    throw new Error(
      data.error?.message ??
        data.error_description ??
        "Link token response was missing tokens.",
    );
  }
  // Treat a missing expires_in as already-expired so the next call refreshes
  // rather than sending a token we cannot reason about.
  const expiresInMs = (data.expires_in ?? 0) * 1000;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
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
  const body = new URLSearchParams();
  body.set("oauth_client_id", getLinkOauthClientId());

  const response = await linkRequest<LinkTokenResponse>(
    `${LINK_AUTH_INTENT_PATH}/${encodeURIComponent(params.linkAuthIntentId)}/tokens`,
    body,
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
  linkAuthIntentId: string;
  refreshToken: string;
}): Promise<LinkTokens> {
  const body = new URLSearchParams();
  body.set("oauth_client_id", getLinkOauthClientId());
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", params.refreshToken);

  const response = await linkRequest<LinkTokenResponse>(
    `${LINK_AUTH_INTENT_PATH}/${encodeURIComponent(params.linkAuthIntentId)}/tokens`,
    body,
  );

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
