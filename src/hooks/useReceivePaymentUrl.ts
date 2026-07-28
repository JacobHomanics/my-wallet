import { useMemo } from 'react';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import { createShareableAppURL } from '@/navigation/linking';

export type ReceivePaymentUrlResult = {
  ready: boolean;
  url: string | null;
  ethereumAddress: string | null;
  solanaAddress: string | null;
};

/** Shareable confirm-send deep link with amount + this user's wallet addresses. */
export function useReceivePaymentUrl(
  usdAmount: string,
): ReceivePaymentUrlResult {
  const { ready, ethereumAddress, solanaAddress } = useTokenBalances();

  const url = useMemo(() => {
    if (!ready || (!ethereumAddress && !solanaAddress) || !usdAmount.trim()) {
      return null;
    }

    return createShareableAppURL('send/confirm', {
      usdAmount: usdAmount.trim(),
      ethereumRecipient: ethereumAddress ?? undefined,
      solanaRecipient: solanaAddress ?? undefined,
      legs: '[]',
    });
  }, [ethereumAddress, ready, solanaAddress, usdAmount]);

  return {
    ready,
    url,
    ethereumAddress,
    solanaAddress,
  };
}
