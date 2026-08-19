import { useAction } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAutoDepositSettings } from '@/hooks/useAutoDepositSettings';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { usePrivyEarn } from '@/hooks/usePrivyEarn';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getPrivyOnrampDestination } from '@/lib/privy/onramp';
import { api } from '../../convex/_generated/api';

const BASE_MAINNET = 'base-mainnet';

export type OnrampVaultDepositPhase =
  | { kind: 'idle' }
  | { kind: 'vault_depositing' }
  | {
    kind: 'complete';
    vaultDeposited: boolean;
    warningMessage: string | null;
  };

function readBaseUsdcBalanceRaw(
  tokens: ReturnType<typeof useTokenBalances>['tokens'],
  tokenAddress: string,
): bigint {
  const normalized = tokenAddress.trim().toLowerCase();
  const token = tokens.find(
    (entry) =>
      entry.network === BASE_MAINNET &&
      entry.tokenAddress?.trim().toLowerCase() === normalized,
  );
  return token?.rawBalance ?? 0n;
}

function completionFromResult(result: {
  status: string;
  message?: string;
}): {
  vaultDeposited: boolean;
  warningMessage: string | null;
} {
  switch (result.status) {
    case 'deposited':
      return { vaultDeposited: true, warningMessage: null };
    case 'skipped':
    case 'nothing_to_deposit':
      return { vaultDeposited: false, warningMessage: null };
    case 'balance_timeout':
      return {
        vaultDeposited: false,
        warningMessage:
          'Deposit received. Funds are still arriving — check your wallet balance shortly.',
      };
    case 'failed':
      return {
        vaultDeposited: false,
        warningMessage:
          result.message ??
          'Deposit received, but funds could not be moved to your vault. They remain in your wallet balance.',
      };
    default:
      return { vaultDeposited: false, warningMessage: null };
  }
}

/**
 * Snapshots Base USDC before an onramp and waits for vault auto-deposit after
 * fulfillment when enabled.
 */
export function useOnrampVaultDepositCompletion() {
  const { enabled: autoDepositEnabled } = useAutoDepositSettings();
  const { selectedNetwork, selectedCurrency } = useOnrampSettings();
  const { tokens, refresh: refreshTokenBalances } = useTokenBalances();
  const { refresh: refreshEarn } = usePrivyEarn();
  const { wallets } = useUserWallets();
  const autoDepositAfterOnramp = useAction(api.earn.autoDepositAfterOnramp);
  const [phase, setPhase] = useState<OnrampVaultDepositPhase>({ kind: 'idle' });

  const destination = getPrivyOnrampDestination({
    network: selectedNetwork.id,
    currency: selectedCurrency.id,
  });
  const willAutoDepositToVault =
    autoDepositEnabled &&
    selectedNetwork.id === 'base' &&
    selectedCurrency.id === 'usdc' &&
    destination?.chain === 'eip155:8453';

  const getPriorBaseUsdcBalanceRaw = useCallback((): bigint => {
    if (!destination?.asset) {
      return 0n;
    }
    return readBaseUsdcBalanceRaw(tokens, destination.asset);
  }, [destination, tokens]);

  const completeOnramp = useCallback(
    async (priorBalanceRaw: bigint) => {
      if (!willAutoDepositToVault) {
        setPhase({ kind: 'complete', vaultDeposited: false, warningMessage: null });
        void refreshTokenBalances();
        return;
      }

      const ethereumWallet = wallets.find((wallet) => wallet.chain === 'ethereum');
      const ethereumWalletId = ethereumWallet?.id?.trim();
      const ethereumAddress = ethereumWallet?.address?.trim();
      if (!ethereumWalletId || !ethereumAddress) {
        setPhase({
          kind: 'complete',
          vaultDeposited: false,
          warningMessage:
            'Deposit received, but no wallet was available to move funds into your vault.',
        });
        void refreshTokenBalances();
        return;
      }

      setPhase({ kind: 'vault_depositing' });

      try {
        const result = await autoDepositAfterOnramp({
          ethereumWalletId,
          ethereumAddress,
          priorBalanceRaw: priorBalanceRaw.toString(),
        });
        setPhase({
          kind: 'complete',
          ...completionFromResult(result),
        });
        await Promise.all([refreshTokenBalances(), refreshEarn()]);
      } catch (error) {
        console.error('[onramp-auto-deposit] vault deposit failed', error);
        setPhase({
          kind: 'complete',
          vaultDeposited: false,
          warningMessage:
            error instanceof Error
              ? error.message
              : 'Deposit received, but funds could not be moved to your vault.',
        });
        void refreshTokenBalances();
      }
    },
    [
      autoDepositAfterOnramp,
      refreshEarn,
      refreshTokenBalances,
      wallets,
      willAutoDepositToVault,
    ],
  );

  const completionMessage = (() => {
    if (phase.kind !== 'complete') {
      return null;
    }
    if (phase.warningMessage) {
      return phase.warningMessage;
    }
    if (phase.vaultDeposited) {
      return 'Deposit complete.';
    }
    return 'Deposit complete.';
  })();

  return {
    phase,
    willAutoDepositToVault,
    getPriorBaseUsdcBalanceRaw,
    completeOnramp,
    completionMessage,
    isVaultDepositing: phase.kind === 'vault_depositing',
    isComplete: phase.kind === 'complete',
  };
}
