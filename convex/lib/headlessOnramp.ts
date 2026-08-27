/**
 * Stripe crypto onramp sessions in `ui_mode=headless`.
 *
 * Headless sessions are driven entirely by our own UI: we create the session,
 * poll it for a fresh quote while the user reviews the amount, then call
 * `/checkout` when they confirm. The SDK only handles the parts that must not
 * touch our servers (payment method collection, 3DS).
 */

import {
  stripeCryptoErrorMessage,
  stripeCryptoRequest,
} from "./stripeCrypto";

const ONRAMP_SESSIONS_PATH = "/v1/crypto/onramp_sessions";

type QuotePayload = {
  source_total_amount?: string;
  destination_amount?: string;
  destination_currency?: string;
  destination_network?: string;
  fees?: {
    network_fee_amount?: string;
    transaction_fee_amount?: string;
  };
  /** Epoch seconds — quotes are short-lived and must be refreshed. */
  expires_at?: number;
};

type OnrampSessionPayload = {
  id?: string;
  client_secret?: string;
  status?: string;
  transaction_id?: string;
  source_amount?: string;
  destination_amount?: string;
  destination_currency?: string;
  destination_network?: string;
  wallet_address?: string;
  quote?: QuotePayload;
};

export type HeadlessOnrampQuote = {
  sourceTotalAmount: string | null;
  destinationAmount: string | null;
  networkFeeAmount: string | null;
  transactionFeeAmount: string | null;
  /** Epoch ms, or null when Stripe did not return an expiry. */
  expiresAt: number | null;
};

export type HeadlessOnrampSession = {
  id: string;
  clientSecret: string;
  status: string;
  transactionId: string | null;
  destinationAmount: string | null;
  quote: HeadlessOnrampQuote | null;
};

export type CreateHeadlessOnrampSessionParams = {
  oauthToken: string;
  walletAddress: string;
  destinationCurrency: string;
  destinationNetwork: string;
  sourceAmount: string;
  sourceCurrency: string;
  customerIpAddress?: string;
};

/** ACH debits need explicit online mandate acceptance from the payer. */
export type MandateData = {
  ipAddress: string;
  userAgent: string;
};

function toQuote(payload: QuotePayload | undefined): HeadlessOnrampQuote | null {
  if (!payload) {
    return null;
  }
  return {
    sourceTotalAmount: payload.source_total_amount ?? null,
    destinationAmount: payload.destination_amount ?? null,
    networkFeeAmount: payload.fees?.network_fee_amount ?? null,
    transactionFeeAmount: payload.fees?.transaction_fee_amount ?? null,
    expiresAt: payload.expires_at ? payload.expires_at * 1000 : null,
  };
}

function toSession(payload: OnrampSessionPayload): HeadlessOnrampSession {
  if (!payload.id || !payload.client_secret) {
    throw new Error("Stripe returned an onramp session without a client secret.");
  }
  return {
    id: payload.id,
    clientSecret: payload.client_secret,
    status: payload.status ?? "initialized",
    transactionId: payload.transaction_id ?? null,
    destinationAmount:
      payload.destination_amount ?? payload.quote?.destination_amount ?? null,
    quote: toQuote(payload.quote),
  };
}

/**
 * Create a headless session for an authenticated Link user.
 *
 * The session is bound to the user's Link identity via the OAuth token, so
 * Stripe reuses their existing KYC and saved payment methods instead of
 * re-collecting anything.
 */
export async function createHeadlessOnrampSession(
  params: CreateHeadlessOnrampSessionParams,
): Promise<HeadlessOnrampSession> {
  const body = new URLSearchParams();
  body.set("ui_mode", "headless");
  body.set("wallet_address", params.walletAddress);
  body.set("destination_currency", params.destinationCurrency);
  body.set("destination_network", params.destinationNetwork);
  body.set("source_currency", params.sourceCurrency);
  body.set("source_amount", params.sourceAmount);
  body.set("lock_wallet_address", "true");
  if (params.customerIpAddress?.trim()) {
    body.set("customer_ip_address", params.customerIpAddress.trim());
  }

  const response = await stripeCryptoRequest<OnrampSessionPayload>({
    path: ONRAMP_SESSIONS_PATH,
    method: "POST",
    body,
    oauthToken: params.oauthToken,
  });

  if (!response.ok) {
    throw new Error(
      stripeCryptoErrorMessage(response, "Could not start your deposit"),
    );
  }

  return toSession(response.data);
}

/** Re-read a session — used to refresh an expiring quote and to poll status. */
export async function retrieveHeadlessOnrampSession(params: {
  oauthToken: string;
  sessionId: string;
}): Promise<HeadlessOnrampSession> {
  const response = await stripeCryptoRequest<OnrampSessionPayload>({
    path: `${ONRAMP_SESSIONS_PATH}/${encodeURIComponent(params.sessionId)}`,
    oauthToken: params.oauthToken,
  });

  if (!response.ok) {
    throw new Error(
      stripeCryptoErrorMessage(response, "Could not refresh your deposit quote"),
    );
  }

  return toSession(response.data);
}

/**
 * Confirm the purchase with the collected payment method.
 *
 * `mandateData` is required for `us_bank_account` (ACH) payments: Stripe needs
 * the IP and user agent that accepted the debit authorization. Cards ignore it.
 */
export async function checkoutHeadlessOnrampSession(params: {
  oauthToken: string;
  sessionId: string;
  paymentTokenId: string;
  mandateData?: MandateData;
  idempotencyKey?: string;
}): Promise<HeadlessOnrampSession> {
  const body = new URLSearchParams();
  body.set("payment_token", params.paymentTokenId);
  if (params.mandateData) {
    body.set("mandate_data[customer_acceptance][type]", "online");
    body.set(
      "mandate_data[customer_acceptance][online][ip_address]",
      params.mandateData.ipAddress,
    );
    body.set(
      "mandate_data[customer_acceptance][online][user_agent]",
      params.mandateData.userAgent,
    );
  }

  const response = await stripeCryptoRequest<OnrampSessionPayload>({
    path: `${ONRAMP_SESSIONS_PATH}/${encodeURIComponent(params.sessionId)}/checkout`,
    method: "POST",
    body,
    oauthToken: params.oauthToken,
    idempotencyKey: params.idempotencyKey,
  });

  if (!response.ok) {
    throw new Error(
      stripeCryptoErrorMessage(response, "Your payment could not be completed"),
    );
  }

  return toSession(response.data);
}
