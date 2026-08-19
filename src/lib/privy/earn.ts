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
  failure_reason?: { message: string } | null;
};

/** Basis points (500 = 5.00%). */
export function formatEarnApy(basisPoints: number | null): string {
  if (basisPoints == null || !Number.isFinite(basisPoints)) {
    return '—';
  }
  return `${(basisPoints / 100).toFixed(2)}%`;
}

export function formatEarnAssetSymbol(symbol: string): string {
  return symbol.toUpperCase();
}

/** Converts a human-readable decimal amount to smallest-unit bigint. */
export function parseEarnDecimalToRaw(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return 0n;
  }

  const [wholePart, fractionPart = ''] = trimmed.split('.');
  const fraction = fractionPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(`${wholePart}${fraction}`);
}

export function capEarnRawAmount(requested: bigint, max: bigint): bigint {
  return requested > max ? max : requested;
}

export function formatEarnRawAmount(raw: string, decimals: number): string {
  try {
    const value = BigInt(raw);
    const base = 10n ** BigInt(decimals);
    const whole = value / base;
    const fraction = value % base;
    if (fraction === 0n) {
      return whole.toString();
    }
    const fractionStr = fraction
      .toString()
      .padStart(decimals, '0')
      .replace(/0+$/, '');
    return `${whole}.${fractionStr}`;
  } catch {
    return '0';
  }
}

export function calculateEarnedYield(position: EarnVaultPosition): bigint {
  const assets = BigInt(position.assets_in_vault);
  const deposited = BigInt(position.total_deposited);
  const withdrawn = BigInt(position.total_withdrawn);
  return assets - (deposited - withdrawn);
}

/** Vault assets are USD stablecoins — human amount equals USD value. */
export function getEarnVaultBalanceUsd(
  position: EarnVaultPosition | null,
): number {
  if (!position) {
    return 0;
  }

  const vaultBalance = formatEarnRawAmount(
    position.assets_in_vault,
    position.asset.decimals,
  );
  const usd = Number(vaultBalance);
  return Number.isFinite(usd) && usd >= 0 ? usd : 0;
}

export function isEarnActionPending(action: EarnWalletAction): boolean {
  return action.status === 'pending' || action.status === 'processing';
}

export function isEarnActionSucceeded(action: EarnWalletAction): boolean {
  return action.status === 'succeeded';
}

export function isEarnActionFailed(action: EarnWalletAction): boolean {
  return action.status === 'failed' || action.status === 'rejected';
}

export function formatEarnActionError(
  action: EarnWalletAction,
  label: string,
): string {
  if (action.failure_reason?.message) {
    return action.failure_reason.message;
  }
  return `${label} ${action.status}.`;
}

const EARN_ACTION_POLL_MS = 2_000;
const EARN_ACTION_POLL_MAX_ATTEMPTS = 30;

export async function pollEarnAction(
  getAction: (actionId: string) => Promise<EarnWalletAction>,
  actionId: string,
): Promise<EarnWalletAction> {
  let latest = await getAction(actionId);

  for (
    let attempt = 0;
    isEarnActionPending(latest) && attempt < EARN_ACTION_POLL_MAX_ATTEMPTS;
    attempt += 1
  ) {
    await new Promise((resolve) => {
      setTimeout(resolve, EARN_ACTION_POLL_MS);
    });
    latest = await getAction(actionId);
  }

  return latest;
}
