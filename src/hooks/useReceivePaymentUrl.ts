import { useMemo } from 'react';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import { createShareableAppURL } from '@/navigation/linking';

export type ReceivePaymentUrlResult = {
  ready: boolean;
  url: string | null;
  ethereumAddress: string | null;
  solanaAddress: string | null;
};

/** Shareable confirm-send deep link that prefills this user's wallet addresses. */
export function useReceivePaymentUrl(): ReceivePaymentUrlResult {
  const { ready, ethereumAddress, solanaAddress } = useTokenBalances();

  const url = useMemo(() => {
    if (!ready || (!ethereumAddress && !solanaAddress)) {
      return null;
    }

    return createShareableAppURL('send/confirm', {
      ethereumRecipient: ethereumAddress ?? undefined,
      solanaRecipient: solanaAddress ?? undefined,
      legs: '[]',
    });
  }, [ethereumAddress, ready, solanaAddress]);

  return {
    ready,
    url,
    ethereumAddress,
    solanaAddress,
  };
}
