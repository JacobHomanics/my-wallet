import { isNativeTokenAddress } from "./networks";
import { normalizeEvmAddress } from "./walletIdentity";

export type VaultUsdcLeg = {
  network: string;
  tokenAddress: string | null;
  symbol: string;
  amountRaw: string | bigint;
};

export function isVaultUsdcLeg(
  leg: VaultUsdcLeg,
  vaultNetwork: string,
  vaultAssetAddress: string,
): boolean {
  if (leg.network !== vaultNetwork) {
    return false;
  }

  if (isNativeTokenAddress(leg.tokenAddress)) {
    return false;
  }

  const symbol = leg.symbol.trim().toLowerCase();
  const isUsdcSymbol = symbol === "usdc" || symbol.startsWith("usdc.");

  if (leg.tokenAddress) {
    const addressMatch =
      normalizeEvmAddress(leg.tokenAddress) ===
      normalizeEvmAddress(vaultAssetAddress);
    return addressMatch || isUsdcSymbol;
  }

  return isUsdcSymbol;
}

export function sumVaultUsdcLegsRaw(
  legs: readonly VaultUsdcLeg[],
  vaultNetwork: string,
  vaultAssetAddress: string,
): bigint {
  let total = 0n;
  for (const leg of legs) {
    if (!isVaultUsdcLeg(leg, vaultNetwork, vaultAssetAddress)) {
      continue;
    }
    total += BigInt(leg.amountRaw);
  }
  return total;
}
