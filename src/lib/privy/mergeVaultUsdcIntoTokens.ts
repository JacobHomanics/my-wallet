import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkLabel } from '@/lib/alchemy/networks';
import type { EarnVaultDetails } from '@/lib/privy/earn';
import { formatEarnRawAmount } from '@/lib/privy/earn';
import { getNetworkFromCaip2 } from '@/lib/privy/vaultUsdc';

function usdFromRaw(raw: bigint, decimals: number): number {
  const scale = 10 ** Math.max(0, decimals);
  const divisor = 10n ** BigInt(Math.max(0, decimals));
  const whole = Number(raw / divisor);
  const fraction = Number(raw % divisor) / scale;
  const usd = whole + fraction;
  return Number.isFinite(usd) ? usd : 0;
}

function mergeTokenBalance(
  token: OwnedToken,
  vaultRaw: bigint,
  vault: EarnVaultDetails,
): OwnedToken {
  const combinedRaw = token.rawBalance + vaultRaw;
  const balanceFormatted = formatEarnRawAmount(
    combinedRaw.toString(),
    vault.asset.decimals,
  );
  // Keep USD aligned with raw units (avoids wallet USD + vault float mismatch).
  const combinedUsd = usdFromRaw(combinedRaw, vault.asset.decimals);

  return {
    ...token,
    rawBalance: combinedRaw,
    balanceFormatted,
    usdValue: combinedUsd,
  };
}

function createVaultUsdcToken(
  vault: EarnVaultDetails,
  vaultRaw: bigint,
): OwnedToken | null {
  const network = getNetworkFromCaip2(vault.caip2);
  if (!network) {
    return null;
  }

  const balanceFormatted = formatEarnRawAmount(
    vaultRaw.toString(),
    vault.asset.decimals,
  );
  const usd = usdFromRaw(vaultRaw, vault.asset.decimals);

  return {
    id: `${network}:${vault.asset.address.toLowerCase()}`,
    network,
    networkLabel: getNetworkLabel(network),
    tokenAddress: vault.asset.address,
    symbol: vault.asset.symbol.toUpperCase(),
    name: vault.asset.symbol.toUpperCase(),
    decimals: vault.asset.decimals,
    rawBalance: vaultRaw,
    balanceFormatted,
    usdValue: usd > 0 ? usd : null,
    logoUrl: null,
  };
}

/** Adds vault USDC to the matching wallet token for send allocation. */
export function mergeVaultUsdcIntoTokens(
  tokens: readonly OwnedToken[],
  vault: EarnVaultDetails,
  vaultRaw: bigint,
): OwnedToken[] {
  if (vaultRaw <= 0n) {
    return [...tokens];
  }

  const assetAddress = vault.asset.address.toLowerCase();
  let merged = false;

  const next = tokens.map((token) => {
    if (token.tokenAddress?.toLowerCase() !== assetAddress) {
      return token;
    }

    merged = true;
    return mergeTokenBalance(token, vaultRaw, vault);
  });

  if (merged) {
    return next;
  }

  const synthetic = createVaultUsdcToken(vault, vaultRaw);
  return synthetic ? [...next, synthetic] : next;
}
