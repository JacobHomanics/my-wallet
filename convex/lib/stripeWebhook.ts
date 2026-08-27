/**
 * Stripe webhook signature verification.
 *
 * Convex HTTP actions run on the V8 runtime, so this uses Web Crypto rather
 * than the Stripe SDK's Node-only `constructEvent`. The webhook is the only
 * thing allowed to mark a deposit fulfilled, which makes verifying it the
 * security boundary of the whole flow: an unsigned request must never reach the
 * auto-deposit pipeline.
 */

/** Reject signatures older than this to blunt replay attempts. */
const SIGNATURE_TOLERANCE_SECONDS = 300;

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing STRIPE_WEBHOOK_SECRET — set it with `npx convex env set STRIPE_WEBHOOK_SECRET …`",
    );
  }
  return secret;
}

type ParsedSignatureHeader = {
  timestamp: number;
  signatures: string[];
};

/** `t=1699999999,v1=abc…,v1=def…` — Stripe may send several v1 entries. */
function parseSignatureHeader(header: string): ParsedSignatureHeader | null {
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (!key || !value) {
      continue;
    }
    if (key.trim() === "t") {
      const parsed = Number(value.trim());
      timestamp = Number.isFinite(parsed) ? parsed : null;
    } else if (key.trim() === "v1") {
      signatures.push(value.trim());
    }
  }

  if (timestamp === null || signatures.length === 0) {
    return null;
  }
  return { timestamp, signatures };
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent, value-constant comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function computeSignature(params: {
  secret: string;
  payload: string;
  timestamp: number;
}): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(params.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${params.timestamp}.${params.payload}`),
  );
  return toHex(signature);
}

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export type VerifyWebhookResult =
  | { ok: true; event: StripeWebhookEvent }
  | { ok: false; reason: string };

/**
 * Verify the `Stripe-Signature` header against the raw body and parse the
 * event. Every failure path returns a reason instead of throwing so the caller
 * can answer 400 and log why.
 */
export async function verifyStripeWebhook(params: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
  nowSeconds?: number;
}): Promise<VerifyWebhookResult> {
  if (!params.signatureHeader) {
    return { ok: false, reason: "Missing Stripe-Signature header." };
  }

  const parsed = parseSignatureHeader(params.signatureHeader);
  if (!parsed) {
    return { ok: false, reason: "Malformed Stripe-Signature header." };
  }

  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "Signature timestamp outside tolerance." };
  }

  const expected = await computeSignature({
    secret: params.secret,
    payload: params.payload,
    timestamp: parsed.timestamp,
  });

  if (!parsed.signatures.some((candidate) => timingSafeEqual(candidate, expected))) {
    return { ok: false, reason: "Signature mismatch." };
  }

  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(params.payload) as StripeWebhookEvent;
  } catch {
    return { ok: false, reason: "Body was not valid JSON." };
  }

  if (!event.id || !event.type) {
    return { ok: false, reason: "Event was missing id or type." };
  }

  return { ok: true, event };
}

export type OnrampSessionEventPayload = {
  sessionId: string;
  status: string | null;
  transactionId: string | null;
  destinationAmount: string | null;
  failureReason: string | null;
};

/** Pull the onramp session fields we mirror out of an event's data object. */
export function readOnrampSessionEvent(
  event: StripeWebhookEvent,
): OnrampSessionEventPayload | null {
  const object = event.data?.object;
  if (!object || typeof object !== "object") {
    return null;
  }

  const id = object["id"];
  if (typeof id !== "string" || !id.startsWith("cos_")) {
    return null;
  }

  const readString = (key: string): string | null => {
    const value = object[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  return {
    sessionId: id,
    status: readString("status"),
    transactionId: readString("transaction_id"),
    destinationAmount: readString("destination_amount"),
    failureReason: readString("failure_reason") ?? readString("rejection_reason"),
  };
}
