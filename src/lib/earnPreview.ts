import type { EarnAsset, EarnVaultDetails, EarnVaultPosition } from '@/lib/privy/earn';

/** Sample vault balance shown when signed out. */
export const EARN_PREVIEW_VAULT_USD = 4.2;

/** Accrued yield included in the sample position. */
export const EARN_PREVIEW_EARNED_USD = 0.13;

/** Wallet balance that could be deposited, matching the home sample. */
export const EARN_PREVIEW_DEPOSITABLE_USD = 13.37;

/** 4.20% APY in basis points. */
export const EARN_PREVIEW_APY_BPS = 420;

const PREVIEW_ASSET: EarnAsset = {
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'USDC',
  decimals: 6,
};

function usdToRaw(usd: number, decimals: number): string {
  return Math.round(usd * 10 ** decimals).toString();
}

export const EARN_PREVIEW_VAULT: EarnVaultDetails = {
  id: 'preview',
  name: 'Sample vault',
  vault_address: '0x0000000000000000000000000000000000000000',
  asset: PREVIEW_ASSET,
  caip2: 'eip155:1',
  user_apy: EARN_PREVIEW_APY_BPS,
  app_apy: EARN_PREVIEW_APY_BPS,
  tvl_usd: null,
  available_liquidity_usd: null,
  provider: 'preview',
};

/** Position whose vault total is 4.20 and earned yield is 0.13. */
export const EARN_PREVIEW_POSITION: EarnVaultPosition = {
  asset: PREVIEW_ASSET,
  total_deposited: usdToRaw(
    EARN_PREVIEW_VAULT_USD - EARN_PREVIEW_EARNED_USD,
    PREVIEW_ASSET.decimals,
  ),
  total_withdrawn: '0',
  assets_in_vault: usdToRaw(EARN_PREVIEW_VAULT_USD, PREVIEW_ASSET.decimals),
  shares_in_vault: usdToRaw(EARN_PREVIEW_VAULT_USD, PREVIEW_ASSET.decimals),
};
