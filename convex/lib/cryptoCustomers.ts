/**
 * Read helpers for `/v1/crypto/customers/*`.
 *
 * The headless flow decides what to show the user — collect KYC? register a
 * wallet? collect a payment method? — from the customer's current server-side
 * state, so these reads gate every step of the screen.
 */

import {
  stripeCryptoErrorMessage,
  stripeCryptoRequest,
} from "./stripeCrypto";

const CUSTOMERS_PATH = "/v1/crypto/customers";

/** Sub-resources of the crypto customer, per the private-preview API. */
const WALLETS_SUBPATH = "crypto_consumer_wallets";
const PAYMENT_TOKENS_SUBPATH = "payment_tokens";

type StripeList<T> = { data?: T[] };

type CryptoConsumerWalletPayload = {
  id?: string;
  wallet_address?: string;
  network?: string;
};

type PaymentTokenPayload = {
  id?: string;
  type?: string;
  display_name?: string;
  last4?: string;
};

type CryptoCustomerPayload = {
  id?: string;
  kyc_status?: string;
  identity_verification_status?: string;
  crypto_consumer_wallets?: StripeList<CryptoConsumerWalletPayload>;
  payment_tokens?: StripeList<PaymentTokenPayload>;
};

export type CryptoConsumerWallet = {
  id: string;
  address: string;
  network: string;
};

export type CryptoPaymentToken = {
  id: string;
  /** `card`, `us_bank_account`, … */
  type: string;
  displayName: string | null;
  last4: string | null;
};

export type CryptoCustomerState = {
  cryptoCustomerId: string;
  /** `not_started` until the user submits KYC; `verified` unlocks checkout. */
  kycStatus: string;
  wallets: CryptoConsumerWallet[];
  paymentTokens: CryptoPaymentToken[];
};

function toWallet(payload: CryptoConsumerWalletPayload): CryptoConsumerWallet | null {
  if (!payload.id || !payload.wallet_address) {
    return null;
  }
  return {
    id: payload.id,
    address: payload.wallet_address,
    network: payload.network ?? "",
  };
}

function toPaymentToken(payload: PaymentTokenPayload): CryptoPaymentToken | null {
  if (!payload.id) {
    return null;
  }
  return {
    id: payload.id,
    type: payload.type ?? "unknown",
    displayName: payload.display_name ?? null,
    last4: payload.last4 ?? null,
  };
}

function compact<T>(values: (T | null)[]): T[] {
  return values.filter((value): value is T => value !== null);
}

async function listSubResource<T>(params: {
  cryptoCustomerId: string;
  oauthToken: string;
  subPath: string;
}): Promise<T[]> {
  const response = await stripeCryptoRequest<StripeList<T>>({
    path: `${CUSTOMERS_PATH}/${encodeURIComponent(params.cryptoCustomerId)}/${params.subPath}`,
    oauthToken: params.oauthToken,
  });
  if (!response.ok) {
    throw new Error(
      stripeCryptoErrorMessage(
        response,
        `Could not load crypto customer ${params.subPath}`,
      ),
    );
  }
  return response.data.data ?? [];
}

/**
 * Fetch KYC status, registered wallets, and saved payment methods in one shot.
 *
 * Wallets and payment tokens come back embedded on the customer object when
 * Stripe expands them; the sub-resource reads are the fallback for when it
 * doesn't, so the screen never has to care which shape arrived.
 */
export async function fetchCryptoCustomerState(params: {
  cryptoCustomerId: string;
  oauthToken: string;
}): Promise<CryptoCustomerState> {
  const response = await stripeCryptoRequest<CryptoCustomerPayload>({
    path: `${CUSTOMERS_PATH}/${encodeURIComponent(params.cryptoCustomerId)}`,
    oauthToken: params.oauthToken,
  });

  if (!response.ok) {
    throw new Error(
      stripeCryptoErrorMessage(response, "Could not load your Link account"),
    );
  }

  const embeddedWallets = response.data.crypto_consumer_wallets?.data;
  const embeddedPaymentTokens = response.data.payment_tokens?.data;

  const [wallets, paymentTokens] = await Promise.all([
    embeddedWallets
      ? Promise.resolve(embeddedWallets)
      : listSubResource<CryptoConsumerWalletPayload>({
          ...params,
          subPath: WALLETS_SUBPATH,
        }),
    embeddedPaymentTokens
      ? Promise.resolve(embeddedPaymentTokens)
      : listSubResource<PaymentTokenPayload>({
          ...params,
          subPath: PAYMENT_TOKENS_SUBPATH,
        }),
  ]);

  return {
    cryptoCustomerId: response.data.id ?? params.cryptoCustomerId,
    kycStatus:
      response.data.kyc_status ??
      response.data.identity_verification_status ??
      "not_started",
    wallets: compact(wallets.map(toWallet)),
    paymentTokens: compact(paymentTokens.map(toPaymentToken)),
  };
}

/** True when the user already registered this address for this network. */
export function hasRegisteredWallet(
  state: CryptoCustomerState,
  params: { address: string; network: string },
): boolean {
  const address = params.address.trim().toLowerCase();
  const network = params.network.trim().toLowerCase();
  return state.wallets.some(
    (wallet) =>
      wallet.address.trim().toLowerCase() === address &&
      wallet.network.trim().toLowerCase() === network,
  );
}
