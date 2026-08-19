import { useCallback, useState } from 'react';
import { useAction } from 'convex/react';

import { api } from '../../convex/_generated/api';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useUserWallets } from '@/hooks/useUserWallets';
import {
  formatCashbackActionError,
  parseWholePointsInput,
  pointsWholeToUsdcAmount,
} from '@/lib/cashback';

export type CashbackRedemptionResult = {
  pointsAmount: string;
  usdcAmount: string;
  pointsHash: string;
  usdcHash: string;
};

export type UseCashbackRedemptionResult = {
  ready: boolean;
  acting: boolean;
  actionError: string | null;
  lastResult: CashbackRedemptionResult | null;
  redeem: (pointsAmount: string) => Promise<CashbackRedemptionResult | null>;
  clearLastResult: () => void;
  previewUsdcAmount: (pointsAmount: string) => string | null;
};

/**
 * Redeem CashBox Points for USDC via Convex (points → treasury, USDC → wallet).
 */
export function useCashbackRedemption(): UseCashbackRedemptionResult {
  const { config, ready: configReady } = useAppConfig();
  const { ready: walletsReady, wallets } = useUserWallets();
  const { refresh: refreshTokenBalances } = useTokenBalances();
  const redeemAction = useAction(api.cashback.redeem);

  const ethereumWallet = wallets.find((wallet) => wallet.chain === 'ethereum');
  const ethereumWalletId = ethereumWallet?.id?.trim() ?? null;
  const ethereumAddress = ethereumWallet?.address?.trim() ?? null;

  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CashbackRedemptionResult | null>(
    null,
  );

  const ready =
    configReady && walletsReady && Boolean(ethereumWalletId && ethereumAddress);
  const pointsPerUsdc = config?.cashback.pointsPerUsdc ?? null;

  const previewUsdcAmount = useCallback(
    (pointsAmount: string) => {
      if (pointsPerUsdc == null) {
        return null;
      }
      const pointsWhole = parseWholePointsInput(pointsAmount);
      if (pointsWhole == null) {
        return null;
      }
      return pointsWholeToUsdcAmount(pointsWhole, pointsPerUsdc);
    },
    [pointsPerUsdc],
  );

  const clearLastResult = useCallback(() => {
    setLastResult(null);
  }, []);

  const redeem = useCallback(
    async (pointsAmount: string): Promise<CashbackRedemptionResult | null> => {
      if (!ethereumWalletId || !ethereumAddress) {
        setActionError('Wallet is not ready yet.');
        return null;
      }

      const pointsWhole = parseWholePointsInput(pointsAmount);
      if (pointsWhole == null) {
        setActionError('Enter a whole number of points.');
        return null;
      }

      setActing(true);
      setActionError(null);
      setLastResult(null);

      try {
        const result = await redeemAction({
          ethereumWalletId,
          ethereumAddress,
          pointsAmount: pointsWhole.toString(),
        });
        setLastResult(result);
        await refreshTokenBalances();
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Redemption failed';
        setActionError(formatCashbackActionError(message));
        return null;
      } finally {
        setActing(false);
      }
    },
    [
      ethereumAddress,
      ethereumWalletId,
      redeemAction,
      refreshTokenBalances,
    ],
  );

  return {
    ready,
    acting,
    actionError,
    lastResult,
    redeem,
    clearLastResult,
    previewUsdcAmount,
  };
}
