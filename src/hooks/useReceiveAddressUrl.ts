import { useMemo } from 'react';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import { encodeWalletIdentity } from '@/lib/walletIdentity';
import { createShareableAppURL } from '@/navigation/linking';

export type ReceiveAddressUrlResult = {
  ready: boolean;
  url: string | null;
  identityId: string | null;
  ethereumAddress: string | null;
  solanaAddress: string | null;
};

/** Shareable send deep link with this user's reversible wallet identity. */
export function useReceiveAddressUrl(): ReceiveAddressUrlResult {
  const { ready, ethereumAddress, solanaAddress } = useTokenBalances();

  const identityId = useMemo(() => {
    if (!ready || !ethereumAddress || !solanaAddress) {
      return null;
    }

    try {
      return encodeWalletIdentity(ethereumAddress, solanaAddress);
    } catch {
      return null;
    }
  }, [ethereumAddress, ready, solanaAddress]);

  const url = useMemo(() => {
    if (!identityId) {
      return null;
    }

    return createShareableAppURL('send', { identity: identityId });
  }, [identityId]);

  return {
    ready,
    url,
    identityId,
    ethereumAddress,
    solanaAddress,
  };
}
