import {
  formatRawTokenBalance,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import type { EarnVaultDetails } from '@/lib/privy/earn';

export type VaultUsdcFundingSplit = {
  walletRaw: bigint;
  vaultRaw: bigint;
};

export type VaultUsdcFundingLeg = {
  key: string;
  token: OwnedToken;
  amountRaw: bigint;
};

/** Map a CAIP-2 chain id (e.g. `eip155:8453`) to an Alchemy network id. */
export function getNetworkFromCaip2(caip2: string): string | null {
  const match = /^eip155:(\d+)$/.exec(caip2.trim());
  if (!match) {
    return null;
  }

  const chainId = Number(match[1]);
  const networks: Record<string, number> = {
    'eth-mainnet': 1,
    'base-mainnet': 8453,
    'arb-mainnet': 42161,
    'opt-mainnet': 10,
    'polygon-mainnet': 137,
    'avax-mainnet': 43114,
  };

  for (const [network, id] of Object.entries(networks)) {
    if (id === chainId) {
      return network;
    }
  }

  return null;
}

export function isVaultUsdcToken(
  token: OwnedToken,
  vault: EarnVaultDetails,
): boolean {
  const network = getNetworkFromCaip2(vault.caip2);
  if (!network || token.network !== network) {
    return false;
  }

  if (!token.tokenAddress) {
    return false;
  }

  return (
    token.tokenAddress.toLowerCase() === vault.asset.address.toLowerCase()
  );
}

/**
 * Wallet USDC is spent first; any shortfall is covered from the earn vault.
 * Legs are processed in order (merchant allocations, then tax).
 */
export function computeVaultUsdcFundingSplits(params: {
  vault: EarnVaultDetails;
  walletBalanceRaw: bigint;
  legs: readonly VaultUsdcFundingLeg[];
}): Map<string, VaultUsdcFundingSplit> {
  const result = new Map<string, VaultUsdcFundingSplit>();
  let walletRemaining = params.walletBalanceRaw;

  for (const leg of params.legs) {
    if (!isVaultUsdcToken(leg.token, params.vault) || leg.amountRaw <= 0n) {
      continue;
    }

    const fromWallet =
      leg.amountRaw <= walletRemaining ? leg.amountRaw : walletRemaining;
    const fromVault = leg.amountRaw - fromWallet;
    walletRemaining -= fromWallet;

    result.set(leg.key, {
      walletRaw: fromWallet,
      vaultRaw: fromVault,
    });
  }

  return result;
}

export function formatVaultUsdcFundingSplit(
  split: VaultUsdcFundingSplit,
  token: OwnedToken,
): string {
  const parts: string[] = [];

  if (split.walletRaw > 0n) {
    parts.push(
      `Wallet: ${formatRawTokenBalance(split.walletRaw, token.decimals)} ${token.symbol}`,
    );
  }

  if (split.vaultRaw > 0n) {
    parts.push(
      `Vault: ${formatRawTokenBalance(split.vaultRaw, token.decimals)} ${token.symbol}`,
    );
  }

  return parts.join(' · ');
}

export function getVaultUsdcTaxFundingKey(tokenId: string): string {
  return `tax:${tokenId}`;
}
