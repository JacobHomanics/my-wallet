import { useMemo } from 'react';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import { encodeWalletIdentity } from '@/lib/walletIdentity';
import { createShareableAppURL } from '@/navigation/linking';

export type ReceivePaymentUrlResult = {
  ready: boolean;
  url: string | null;
  identityId: string | null;
  ethereumAddress: string | null;
  solanaAddress: string | null;
};

/** Shareable confirm-send deep link with amount + reversible wallet identity. */
export function useReceivePaymentUrl(
  usdAmount: string,
): ReceivePaymentUrlResult {
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
    if (!identityId || !usdAmount.trim()) {
      return null;
    }

    return createShareableAppURL('send/confirm', {
      usdAmount: usdAmount.trim(),
      identity: identityId,
      legs: '[]',
    });
  }, [identityId, usdAmount]);

  return {
    ready,
    url,
    identityId,
    ethereumAddress,
    solanaAddress,
  };
}
