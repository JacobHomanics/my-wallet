import type { AuthorizationContext, PrivyClient } from "@privy-io/node";

/** Matches @privy-io/node base URL + /v1 paths (not /api/v1). */
const PRIVY_API_BASE = "https://api.privy.io/v1";

export type EarnAsset = {
  address: string;
  symbol: string;
  decimals: number;
};

export type EarnVaultDetails = {
  id: string;
  name: string;
  vault_address: string;
  asset: EarnAsset;
  caip2: string;
  user_apy: number | null;
  app_apy: number | null;
  tvl_usd: number | null;
  available_liquidity_usd: number | null;
  provider: string;
};

export type EarnVaultPosition = {
  asset: EarnAsset;
  total_deposited: string;
  total_withdrawn: string;
  assets_in_vault: string;
  shares_in_vault: string;
};

export type EarnWalletAction = {
  id: string;
  wallet_id: string;
  type: string;
  status: string;
  amount?: string | null;
  raw_amount?: string | null;
  asset?: string | null;
  decimals?: number | null;
  share_amount?: string | null;
  created_at?: string;
};

export function getEarnVaultId(): string {
  const vaultId = process.env.PRIVY_EARN_VAULT_ID?.trim();
  if (!vaultId) {
    throw new Error(
      "Missing PRIVY_EARN_VAULT_ID. Configure a vault in Privy Dashboard → Wallet infrastructure → Earn, then set the vault ID on Convex.",
    );
  }
  return vaultId;
}

function getPrivyBasicAuthHeader(): { appId: string; authorization: string } {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Missing PRIVY_APP_ID or PRIVY_APP_SECRET");
  }
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  return { appId, authorization: `Basic ${credentials}` };
}

async function privyGet<T>(path: string): Promise<T> {
  const { appId, authorization } = getPrivyBasicAuthHeader();
  const response = await fetch(`${PRIVY_API_BASE}${path}`, {
    method: "GET",
    headers: {
      "privy-app-id": appId,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 404) {
      throw new Error(
        `Earn vault not found (${path}). Confirm PRIVY_EARN_VAULT_ID matches the vault ID in Privy Dashboard → Wallet infrastructure → Earn, and that PRIVY_APP_ID / PRIVY_APP_SECRET on Convex match the same Privy app.`,
      );
    }
    throw new Error(`Privy GET ${path} failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

export async function fetchEarnVaultDetails(
  vaultId: string,
): Promise<EarnVaultDetails> {
  return privyGet<EarnVaultDetails>(`/earn/ethereum/vaults/${vaultId}`);
}

export async function fetchEarnVaultPosition(
  walletId: string,
  vaultId: string,
): Promise<EarnVaultPosition> {
  return privyGet<EarnVaultPosition>(
    `/wallets/${walletId}/earn/ethereum/vaults?vault_id=${encodeURIComponent(vaultId)}`,
  );
}

export async function fetchEarnWalletAction(
  walletId: string,
  actionId: string,
): Promise<EarnWalletAction> {
  return privyGet<EarnWalletAction>(
    `/wallets/${walletId}/actions/${actionId}`,
  );
}

export async function depositToEarnVault(params: {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  walletId: string;
  vaultId: string;
  amount: string;
}): Promise<EarnWalletAction> {
  const result = await params.privy.wallets().earn().ethereum().deposit(
    params.walletId,
    {
      vault_id: params.vaultId,
      amount: params.amount,
      authorization_context: params.authorizationContext,
    },
  );

  return {
    id: result.id,
    wallet_id: result.wallet_id,
    type: result.type,
    status: result.status,
    amount: result.amount ?? null,
    raw_amount: result.raw_amount ?? null,
    asset: result.asset ?? null,
    decimals: result.decimals ?? null,
    share_amount: result.share_amount ?? null,
    created_at: result.created_at,
  };
}

export async function withdrawFromEarnVault(params: {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  walletId: string;
  vaultId: string;
  amount: string;
}): Promise<EarnWalletAction> {
  const result = await params.privy.wallets().earn().ethereum().withdraw(
    params.walletId,
    {
      vault_id: params.vaultId,
      amount: params.amount,
      authorization_context: params.authorizationContext,
    },
  );

  return {
    id: result.id,
    wallet_id: result.wallet_id,
    type: result.type,
    status: result.status,
    amount: result.amount ?? null,
    raw_amount: result.raw_amount ?? null,
    asset: result.asset ?? null,
    decimals: result.decimals ?? null,
    share_amount: result.share_amount ?? null,
    created_at: result.created_at,
  };
}
