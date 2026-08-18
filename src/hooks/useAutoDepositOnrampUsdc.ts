import { useAction } from 'convex/react';
import { useCallback } from 'react';

import { useAutoDepositSettings } from '@/hooks/useAutoDepositSettings';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getPrivyOnrampDestination } from '@/lib/privy/onramp';
import { api } from '../../convex/_generated/api';

const BASE_MAINNET = 'base-mainnet';

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

/**
 * Snapshots Base USDC balance before an onramp and triggers a background vault
 * deposit after fulfillment when auto-deposit is enabled.
 */
export function useAutoDepositOnrampUsdc() {
  const { enabled: autoDepositEnabled } = useAutoDepositSettings();
  const { selectedNetwork, selectedCurrency } = useOnrampSettings();
  const { tokens } = useTokenBalances();
  const { wallets } = useUserWallets();
  const autoDepositAfterOnramp = useAction(api.earn.autoDepositAfterOnramp);

  const destination = getPrivyOnrampDestination({
    network: selectedNetwork.id,
    currency: selectedCurrency.id,
  });
  const isBaseUsdcOnramp =
    selectedNetwork.id === 'base' &&
    selectedCurrency.id === 'usdc' &&
    destination?.chain === 'eip155:8453';

  const getPriorBaseUsdcBalanceRaw = useCallback((): bigint => {
    if (!destination?.asset) {
      return 0n;
    }
    return readBaseUsdcBalanceRaw(tokens, destination.asset);
  }, [destination, tokens]);

  const triggerAutoDeposit = useCallback(
    (priorBalanceRaw: bigint) => {
      if (!autoDepositEnabled || !isBaseUsdcOnramp) {
        return;
      }

      const ethereumWallet = wallets.find((wallet) => wallet.chain === 'ethereum');
      const ethereumWalletId = ethereumWallet?.id?.trim();
      const ethereumAddress = ethereumWallet?.address?.trim();
      if (!ethereumWalletId || !ethereumAddress) {
        return;
      }

      void autoDepositAfterOnramp({
        ethereumWalletId,
        ethereumAddress,
        priorBalanceRaw: priorBalanceRaw.toString(),
      }).catch((error) => {
        console.error('[onramp-auto-deposit] background deposit failed', error);
      });
    },
    [
      autoDepositAfterOnramp,
      autoDepositEnabled,
      isBaseUsdcOnramp,
      wallets,
    ],
  );

  return {
    isBaseUsdcOnramp,
    getPriorBaseUsdcBalanceRaw,
    triggerAutoDeposit,
  };
}
