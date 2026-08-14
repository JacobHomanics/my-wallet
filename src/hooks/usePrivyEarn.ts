import { useCallback, useEffect, useState } from 'react';
import { useAction } from 'convex/react';

import { api } from '../../convex/_generated/api';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useUserWallets } from '@/hooks/useUserWallets';
import type {
  EarnVaultDetails,
  EarnVaultPosition,
  EarnWalletAction,
} from '@/lib/privy/earn';
import {
  formatEarnRawAmount,
  isEarnActionFailed,
  isEarnActionSucceeded,
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
  vault: EarnVaultDetails | null;
  position: EarnVaultPosition | null;
  walletAssetBalance: string | null;
  refresh: () => Promise<void>;
  deposit: (amount: string) => Promise<EarnWalletAction | null>;
  withdraw: (amount: string) => Promise<EarnWalletAction | null>;
  withdrawAll: () => Promise<EarnWalletAction | null>;
};

function isVaultNotConfiguredError(message: string): boolean {
  return message.includes('PRIVY_EARN_VAULT_ID');
}

/**
 * Privy Earn vault position, deposit, and withdraw via Convex + Wallet API.
 * @see https://docs.privy.io/wallets/actions/earn/setup
 */
export function usePrivyEarn(): UsePrivyEarnResult {
  const { ready: walletsReady, wallets } = useUserWallets();
  const { tokens, refresh: refreshTokenBalances } = useTokenBalances();
  const getVaultDetails = useAction(api.earn.getVaultDetails);
  const getPosition = useAction(api.earn.getPosition);
  const getAction = useAction(api.earn.getAction);
  const depositAction = useAction(api.earn.deposit);
  const withdrawAction = useAction(api.earn.withdraw);

  const ethereumWallet = wallets.find((wallet) => wallet.chain === 'ethereum');
  const ethereumWalletId = ethereumWallet?.id?.trim() ?? null;

  const [vault, setVault] = useState<EarnVaultDetails | null>(null);
  const [position, setPosition] = useState<EarnVaultPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!walletsReady) {
        return;
      }

      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
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
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [ethereumWalletId, getPosition, getVaultDetails, walletsReady],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  const refresh = useCallback(async () => {
    await load('refresh');
    refreshTokenBalances();
  }, [load, refreshTokenBalances]);

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
          throw new Error(`Deposit ${finalAction.status}.`);
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

  const withdraw = useCallback(
    async (amount: string) => {
      if (!ethereumWalletId) {
        setActionError('No Ethereum wallet available.');
        return null;
      }

      setActing(true);
      setActionError(null);

      try {
        const pending = await withdrawAction({ ethereumWalletId, amount });
        const finalAction = await pollAction(pending.id);
        if (isEarnActionFailed(finalAction)) {
          throw new Error(`Withdrawal ${finalAction.status}.`);
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
    [ethereumWalletId, pollAction, refresh, withdrawAction],
  );

  const withdrawAll = useCallback(async () => {
    if (!position) {
      setActionError('No vault balance to withdraw.');
      return null;
    }

    const amount = formatEarnRawAmount(
      position.assets_in_vault,
      position.asset.decimals,
    );
    if (Number(amount) <= 0) {
      setActionError('No vault balance to withdraw.');
      return null;
    }

    return withdraw(amount);
  }, [position, withdraw]);

  return {
    ready: walletsReady,
    configured,
    loading,
    refreshing,
    acting,
    error,
    actionError,
    vault,
    position,
    walletAssetBalance,
    refresh,
    deposit,
    withdraw,
    withdrawAll,
  };
}
