import { useMemo } from 'react';

import { usePrivyEarn } from '@/hooks/usePrivyEarn';
import { useSendAmountPreview } from '@/hooks/useSendAmountPreview';
import { useSpendableTokens } from '@/hooks/useSpendableTokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useSendVaultUsdc } from '@/hooks/useSendVaultUsdc';
import { mergeVaultUsdcIntoTokens } from '@/lib/privy/mergeVaultUsdcIntoTokens';

/**
 * Spendable tokens for the send flow, optionally including vault USDC when the
 * user has enabled “Use vault USDC when sending”.
 */
export function useSendSpendableTokens() {
  const preview = useSendAmountPreview();
  const { tokens, loading, ready, refresh, ethereumAddress, solanaAddress } =
    useTokenBalances();
  const { enabled: vaultSendEnabled } = useSendVaultUsdc();
  const { vault, position, loading: earnLoading } = usePrivyEarn();

  const tokensForSend = useMemo(() => {
    if (!vaultSendEnabled || !vault || !position) {
      return tokens;
    }

    const vaultRaw = BigInt(position.assets_in_vault);
    if (vaultRaw <= 0n) {
      return tokens;
    }

    return mergeVaultUsdcIntoTokens(tokens, vault, vaultRaw);
  }, [position, tokens, vault, vaultSendEnabled]);

  const spendable = useSpendableTokens(tokensForSend);

  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const availableBalanceLoading =
    ready &&
    hasWallet &&
    (loading ||
      !spendable.gasEstimatesReady ||
      (vaultSendEnabled && earnLoading));

  if (preview.isPreview) {
    return {
      tokens: preview.tokens,
      tokensForSend: preview.tokens,
      loading: false,
      ready: true,
      refresh,
      ethereumAddress,
      solanaAddress,
      availableBalanceLoading: false,
      spendableTokens: preview.tokens,
      availableUsd: preview.availableUsd,
      availableLabel: preview.availableLabel,
      gasEstimatesReady: true,
      isPreview: true,
    };
  }

  return {
    tokens,
    tokensForSend,
    loading,
    ready,
    refresh,
    ethereumAddress,
    solanaAddress,
    availableBalanceLoading,
    isPreview: false,
    ...spendable,
  };
}
