import { useMemo } from 'react';

import { useReceivePreview } from '@/hooks/useReceivePreview';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { encodeWalletIdentity } from '@/lib/walletIdentity';
import { createShareableAppURL } from '@/navigation/linking';

export type ReceivePaymentUrlResult = {
  ready: boolean;
  isPreview: boolean;
  url: string | null;
  identityId: string | null;
  username: string | null;
  ethereumAddress: string | null;
  solanaAddress: string | null;
};

/** Shareable confirm-send deep link with amount + reversible wallet identity. */
export function useReceivePaymentUrl(
  usdAmount: string,
): ReceivePaymentUrlResult {
  const { isPreview, qrData, identityId: previewIdentityId, username } =
    useReceivePreview();
  const { ready, ethereumAddress, solanaAddress } = useTokenBalances();

  const identityId = useMemo(() => {
    if (isPreview) {
      return previewIdentityId;
    }
    if (!ready || !ethereumAddress || !solanaAddress) {
      return null;
    }

    try {
      return encodeWalletIdentity(ethereumAddress, solanaAddress);
    } catch {
      return null;
    }
  }, [ethereumAddress, isPreview, previewIdentityId, ready, solanaAddress]);

  const url = useMemo(() => {
    if (isPreview) {
      return usdAmount.trim() ? `${qrData}:${usdAmount.trim()}` : qrData;
    }
    if (!identityId || !usdAmount.trim()) {
      return null;
    }

    return createShareableAppURL('send/confirm', {
      usdAmount: usdAmount.trim(),
      identity: identityId,
      legs: '[]',
    });
  }, [identityId, isPreview, qrData, usdAmount]);

  return {
    ready: isPreview || ready,
    isPreview,
    url,
    identityId,
    username: isPreview ? username : null,
    ethereumAddress,
    solanaAddress,
  };
}
