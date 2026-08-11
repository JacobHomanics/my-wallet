const STRIPE_ONRAMP_SESSIONS_URL =
  "https://api.stripe.com/v1/crypto/onramp_sessions";

export type CreateCryptoOnrampSessionParams = {
  walletAddress: string;
  sourceAmount?: string;
  sourceCurrency?: string;
  customerIpAddress?: string;
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

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY — set it with `npx convex env set STRIPE_SECRET_KEY …`",
    );
  }
  return key;
}

/**
 * Mint a Stripe Crypto Onramp session for the user's EVM wallet.
 * Defaults to Base ETH; users can also buy USDC (Base / Ethereum).
 * @see https://docs.stripe.com/api/crypto/onramp_sessions/create
 */
export async function createCryptoOnrampSession(
  params: CreateCryptoOnrampSessionParams,
): Promise<CryptoOnrampSessionResult> {
  const secret = getStripeSecretKey();
  const body = new URLSearchParams();

  // Prefill the same EVM address for ethereum + Base. Stripe requires every
  // wallet_addresses network key to appear in destination_networks.
  body.set("wallet_addresses[ethereum]", params.walletAddress);
  body.set("wallet_addresses[base_network]", params.walletAddress);
  body.set("lock_wallet_address", "true");
  body.set("destination_currency", "eth");
  body.set("destination_network", "base");
  body.set("destination_currencies[0]", "eth");
  body.set("destination_currencies[1]", "usdc");
  body.set("destination_networks[0]", "base");
  body.set("destination_networks[1]", "ethereum");
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
