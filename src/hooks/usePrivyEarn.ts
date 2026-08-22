import { useCallback, useEffect, useState } from 'react';
import { useAction } from 'convex/react';

import { api } from '../../convex/_generated/api';
import { useEarnPreview } from '@/hooks/useEarnPreview';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useUserWallets } from '@/hooks/useUserWallets';
import type {
  EarnVaultDetails,
  EarnVaultPosition,
  EarnWalletAction,
} from '@/lib/privy/earn';
import {
  capEarnRawAmount,
  formatEarnActionError,
  getEarnVaultBalanceUsd,
  isEarnActionFailed,
  isEarnActionSucceeded,
  parseEarnDecimalToRaw,
  pollEarnAction,
} from '@/lib/privy/earn';

export type UsePrivyEarnResult = {
  ready: boolean;
  configured: boolean;
  loading: boolean;
  refreshing: boolean;
  acting: boolean;
  error: string | null;
  actionError: string | null;
  isPreview: boolean;
  vault: EarnVaultDetails | null;
  position: EarnVaultPosition | null;
  vaultBalanceUsd: number;
  walletAssetBalance: string | null;
  refresh: () => Promise<void>;
  deposit: (amount: string) => Promise<EarnWalletAction | null>;
  withdraw: (amount: string) => Promise<EarnWalletAction | null>;
  withdrawAll: () => Promise<EarnWalletAction | null>;
};

function isVaultNotConfiguredError(message: string): boolean {
  return message.includes('PRIVY_EARN_VAULT_ID');
}

function getEarnLoadKey(
  walletsReady: boolean,
  ethereumWalletId: string | null,
): string {
  if (!walletsReady) {
    return 'pending';
  }
  return `ready:${ethereumWalletId ?? ''}`;
}

/**
 * Privy Earn vault position, deposit, and withdraw via Convex + Wallet API.
 * @see https://docs.privy.io/wallets/actions/earn/setup
 */
export function usePrivyEarn(): UsePrivyEarnResult {
  const {
    isPreview,
    vault: previewVault,
    position: previewPosition,
    vaultBalanceUsd: previewVaultBalanceUsd,
    walletAssetBalance: previewWalletAssetBalance,
  } = useEarnPreview();
  const { ready: walletsReady, wallets } = useUserWallets();
  const { tokens, refresh: refreshTokenBalances } = useTokenBalances();
  const getVaultDetails = useAction(api.earn.getVaultDetails);
  const getPosition = useAction(api.earn.getPosition);
  const getAction = useAction(api.earn.getAction);
  const depositAction = useAction(api.earn.deposit);
  const withdrawAction = useAction(api.earn.withdraw);

  const ethereumWallet = wallets.find((wallet) => wallet.chain === 'ethereum');
  const ethereumWalletId = ethereumWallet?.id?.trim() ?? null;
  const loadKey = getEarnLoadKey(walletsReady, ethereumWalletId);

  const [vault, setVault] = useState<EarnVaultDetails | null>(null);
  const [position, setPosition] = useState<EarnVaultPosition | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loading =
    !isPreview && (loadKey === 'pending' || loadedKey !== loadKey);

  const walletAssetBalance = (() => {
    if (!vault?.asset.address) {
      return null;
    }
    const token = tokens.find(
      (entry) =>
        entry.tokenAddress?.toLowerCase() === vault.asset.address.toLowerCase(),
    );
    return token?.balanceFormatted ?? '0';
  })();

  const vaultBalanceUsd = getEarnVaultBalanceUsd(position);

  const fetchEarnData = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const vaultDetails = await getVaultDetails({});
      setVault(vaultDetails);
      setConfigured(true);

      if (ethereumWalletId) {
        const vaultPosition = await getPosition({ ethereumWalletId });
        setPosition(vaultPosition);
      } else {
        setPosition(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load earn vault.';
      if (isVaultNotConfiguredError(message)) {
        setConfigured(false);
        setVault(null);
        setPosition(null);
        setError(null);
      } else {
        setError(message);
      }
    }
  }, [ethereumWalletId, getPosition, getVaultDetails]);

  useEffect(() => {
    if (isPreview || loadKey === 'pending') {
      return;
    }

    let cancelled = false;

    void (async () => {
      await fetchEarnData();
      if (!cancelled) {
        setLoadedKey(loadKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchEarnData, isPreview, loadKey]);

  const refresh = useCallback(async () => {
    if (isPreview || loadKey === 'pending') {
      return;
    }

    setRefreshing(true);
    try {
      await fetchEarnData();
      setLoadedKey(loadKey);
      refreshTokenBalances();
    } finally {
      setRefreshing(false);
    }
  }, [fetchEarnData, isPreview, loadKey, refreshTokenBalances]);

  const pollAction = useCallback(
    async (actionId: string) => {
      if (!ethereumWalletId) {
        throw new Error('No Ethereum wallet available.');
      }

      return pollEarnAction(
        (id) => getAction({ ethereumWalletId, actionId: id }),
        actionId,
      );
    },
    [ethereumWalletId, getAction],
  );

  const deposit = useCallback(
    async (amount: string) => {
      if (!ethereumWalletId) {
        setActionError('No Ethereum wallet available.');
        return null;
      }

      setActing(true);
      setActionError(null);

      try {
        const pending = await depositAction({ ethereumWalletId, amount });
        const finalAction = await pollAction(pending.id);
        if (isEarnActionFailed(finalAction)) {
          throw new Error(formatEarnActionError(finalAction, 'Deposit'));
        }
        if (!isEarnActionSucceeded(finalAction)) {
          throw new Error('Deposit is still processing. Pull to refresh shortly.');
        }
        await refresh();
        return finalAction;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Deposit failed.';
        setActionError(message);
        return null;
      } finally {
        setActing(false);
      }
    },
    [depositAction, ethereumWalletId, pollAction, refresh],
  );

  const executeWithdraw = useCallback(
    async (params: { amount?: string; rawAmount?: string }) => {
      if (!ethereumWalletId) {
        setActionError('No Ethereum wallet available.');
        return null;
      }

      setActing(true);
      setActionError(null);

      try {
        let rawAmount = params.rawAmount;
        let amount = params.amount;

        if (!rawAmount && amount && position) {
          const requestedRaw = parseEarnDecimalToRaw(
            amount,
            position.asset.decimals,
          );
          const vaultRaw = BigInt(position.assets_in_vault);
          rawAmount = capEarnRawAmount(requestedRaw, vaultRaw).toString();
          amount = undefined;
        }

        if (rawAmount && BigInt(rawAmount) <= 0n) {
          throw new Error('No vault balance to withdraw.');
        }

        const pending = await withdrawAction({
          ethereumWalletId,
          amount,
          rawAmount,
        });
        const finalAction = await pollAction(pending.id);
        if (isEarnActionFailed(finalAction)) {
          throw new Error(formatEarnActionError(finalAction, 'Withdrawal'));
        }
        if (!isEarnActionSucceeded(finalAction)) {
          throw new Error(
            'Withdrawal is still processing. Pull to refresh shortly.',
          );
        }
        await refresh();
        return finalAction;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Withdrawal failed.';
        setActionError(message);
        return null;
      } finally {
        setActing(false);
      }
    },
    [ethereumWalletId, pollAction, position, refresh, withdrawAction],
  );

  const withdraw = useCallback(
    async (amount: string) => executeWithdraw({ amount }),
    [executeWithdraw],
  );

  const withdrawAll = useCallback(async () => {
    if (!position) {
      setActionError('No vault balance to withdraw.');
      return null;
    }

    if (BigInt(position.assets_in_vault) <= 0n) {
      setActionError('No vault balance to withdraw.');
      return null;
    }

    return executeWithdraw({ rawAmount: position.assets_in_vault });
  }, [executeWithdraw, position]);

  if (isPreview) {
    return {
      ready: true,
      configured: true,
      loading: false,
      refreshing: false,
      acting: false,
      error: null,
      actionError: null,
      isPreview: true,
      vault: previewVault,
      position: previewPosition,
      vaultBalanceUsd: previewVaultBalanceUsd,
      walletAssetBalance: previewWalletAssetBalance,
      refresh,
      deposit,
      withdraw,
      withdrawAll,
    };
  }

  return {
    ready: walletsReady,
    configured,
    loading,
    refreshing,
    acting,
    error,
    actionError,
    isPreview: false,
    vault,
    position,
    vaultBalanceUsd,
    walletAssetBalance,
    refresh,
    deposit,
    withdraw,
    withdrawAll,
  };
}
