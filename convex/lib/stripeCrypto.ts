/**
 * Shared request plumbing for the Stripe Crypto Onramp private preview.
 *
 * Every crypto endpoint (onramp sessions, crypto customers, wallets, payment
 * tokens) must pin the preview API version, so it lives here rather than being
 * repeated per call site.
 */

/** Required on every crypto onramp call while the beta is in private preview. */
export const STRIPE_CRYPTO_API_VERSION =
  "2026-07-29.dahlia;crypto_onramp_beta=v2";

const STRIPE_API_BASE = "https://api.stripe.com";

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY — set it with `npx convex env set STRIPE_SECRET_KEY …`",
    );
  }
  return key;
}

export type StripeErrorBody = {
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
};

export type StripeCryptoResponse<T> = {
  ok: boolean;
  status: number;
  data: T & StripeErrorBody;
};

export type StripeCryptoRequest = {
  path: string;
  method?: "GET" | "POST";
  body?: URLSearchParams;
  /**
   * Link OAuth access token for the end user, sent as `Stripe-OAuth-Token`.
   * Required by every `/v1/crypto/customers/*` endpoint.
   */
  oauthToken?: string;
  /** Makes retried POSTs safe to replay. */
  idempotencyKey?: string;
};

/**
 * Issue a Stripe crypto API request. Returns the parsed body alongside the
 * status so callers can branch on expected non-2xx cases (404 "no account",
 * 402 card declines) instead of everything collapsing into one thrown error.
 */
export async function stripeCryptoRequest<T>(
  request: StripeCryptoRequest,
): Promise<StripeCryptoResponse<T>> {
  const secret = getStripeSecretKey();
  const method = request.method ?? "GET";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secret}`,
    "Stripe-Version": STRIPE_CRYPTO_API_VERSION,
  };
  if (request.oauthToken) {
    headers["Stripe-OAuth-Token"] = request.oauthToken;
  }
  if (request.idempotencyKey) {
    headers["Idempotency-Key"] = request.idempotencyKey;
  }
  if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const url =
    method === "GET" && request.body
      ? `${STRIPE_API_BASE}${request.path}?${request.body.toString()}`
      : `${STRIPE_API_BASE}${request.path}`;

  const response = await fetch(url, {
    method,
    headers,
    body: method === "POST" ? (request.body?.toString() ?? "") : undefined,
  });

  const data = (await response.json()) as T & StripeErrorBody;

  return { ok: response.ok, status: response.status, data };
}

/** Turn a non-2xx crypto API response into a message worth surfacing. */
export function stripeCryptoErrorMessage(
  response: StripeCryptoResponse<unknown>,
  fallback: string,
): string {
  return response.data.error?.message ?? `${fallback} (${response.status})`;
}
