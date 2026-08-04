import { useMemo } from 'react';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import { createShareableAppURL } from '@/navigation/linking';

export type ReceiveAddressUrlResult = {
  ready: boolean;
  url: string | null;
  ethereumAddress: string | null;
  solanaAddress: string | null;
};

/** Shareable send deep link with this user's EVM + Solana addresses pre-filled. */
export function useReceiveAddressUrl(): ReceiveAddressUrlResult {
  const { ready, ethereumAddress, solanaAddress } = useTokenBalances();

  const url = useMemo(() => {
    if (!ready || (!ethereumAddress && !solanaAddress)) {
      return null;
    }

    return createShareableAppURL('send', {
      ethereumRecipient: ethereumAddress ?? undefined,
      solanaRecipient: solanaAddress ?? undefined,
    });
  }, [ethereumAddress, ready, solanaAddress]);

  return {
    ready,
    url,
    ethereumAddress,
    solanaAddress,
  };
}
