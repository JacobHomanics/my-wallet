import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkLabel } from '@/lib/alchemy/networks';
import type { EarnVaultDetails } from '@/lib/privy/earn';
import { formatEarnRawAmount } from '@/lib/privy/earn';
import { getNetworkFromCaip2 } from '@/lib/privy/vaultUsdc';

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
  const walletUsd = token.usdValue ?? 0;
  const vaultUsd = Number(formatEarnRawAmount(vaultRaw.toString(), vault.asset.decimals));
  const combinedUsd =
    Number.isFinite(vaultUsd) && vaultUsd >= 0 ? walletUsd + vaultUsd : token.usdValue;

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
  const usd = Number(balanceFormatted);

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
    usdValue: Number.isFinite(usd) && usd >= 0 ? usd : null,
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
