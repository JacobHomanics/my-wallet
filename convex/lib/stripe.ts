import { getStripeSecretKey } from "./stripeCrypto";

const STRIPE_ONRAMP_SESSIONS_URL =
  "https://api.stripe.com/v1/crypto/onramp_sessions";

export type CreateCryptoOnrampSessionParams = {
  walletAddress: string;
  sourceAmount?: string;
  sourceCurrency?: string;
  customerIpAddress?: string;
  destinationCurrency?: string;
  destinationNetwork?: string;
};

export type CryptoOnrampSessionResult = {
  id: string;
  clientSecret: string;
  status: string;
};

type StripeOnrampSessionResponse = {
  id?: string;
  client_secret?: string;
  status?: string;
  error?: {
    message?: string;
    code?: string;
  };
};

const SUPPORTED_DESTINATION_CURRENCIES = ["eth", "usdc", "avax"] as const;
const SUPPORTED_DESTINATION_NETWORKS = [
  "base",
  "ethereum",
  "avalanche",
] as const;

function normalizeSupportedValue<T extends string>(
  value: string | undefined,
  supported: readonly T[],
): T | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return (supported as readonly string[]).includes(normalized)
    ? (normalized as T)
    : null;
}

/**
 * Mint a Stripe Crypto Onramp session for the user's EVM wallet.
 * Uses the caller's preferred default destination while keeping the broader
 * supported list available in the widget.
 * @see https://docs.stripe.com/api/crypto/onramp_sessions/create
 */
export async function createCryptoOnrampSession(
  params: CreateCryptoOnrampSessionParams,
): Promise<CryptoOnrampSessionResult> {
  const secret = getStripeSecretKey();
  const body = new URLSearchParams();
  const destinationCurrency = normalizeSupportedValue(
    params.destinationCurrency,
    SUPPORTED_DESTINATION_CURRENCIES,
  );
  const destinationNetwork = normalizeSupportedValue(
    params.destinationNetwork,
    SUPPORTED_DESTINATION_NETWORKS,
  );

  // Prefill the same EVM address for Ethereum, Base, and Avalanche. Stripe requires every
  // wallet_addresses network key to appear in destination_networks.
  body.set("wallet_addresses[ethereum]", params.walletAddress);
  body.set("wallet_addresses[base_network]", params.walletAddress);
  body.set("wallet_addresses[avalanche]", params.walletAddress);
  body.set("lock_wallet_address", "true");
  if (destinationCurrency) {
    body.set("destination_currency", destinationCurrency);
  }
  if (destinationNetwork) {
    body.set("destination_network", destinationNetwork);
  }
  body.set("destination_currencies[0]", "eth");
  body.set("destination_currencies[1]", "usdc");
  body.set("destination_currencies[2]", "avax");
  body.set("destination_networks[0]", "base");
  body.set("destination_networks[1]", "ethereum");
  body.set("destination_networks[2]", "avalanche");
  body.set("source_currency", params.sourceCurrency ?? "usd");

  if (params.sourceAmount?.trim()) {
    body.set("source_amount", params.sourceAmount.trim());
  }
  if (params.customerIpAddress?.trim()) {
    body.set("customer_ip_address", params.customerIpAddress.trim());
  }

  const response = await fetch(STRIPE_ONRAMP_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await response.json()) as StripeOnrampSessionResponse;

  if (!response.ok || !data.client_secret || !data.id) {
    const message =
      data.error?.message ??
      `Stripe onramp session failed (${response.status})`;
    throw new Error(message);
  }

  return {
    id: data.id,
    clientSecret: data.client_secret,
    status: data.status ?? "initialized",
  };
}
