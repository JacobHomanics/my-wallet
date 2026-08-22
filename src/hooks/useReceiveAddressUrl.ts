import { useMemo } from 'react';

import { useReceivePreview } from '@/hooks/useReceivePreview';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { encodeWalletIdentity } from '@/lib/walletIdentity';
import { createShareableAppURL } from '@/navigation/linking';

export type ReceiveAddressUrlResult = {
  ready: boolean;
  isPreview: boolean;
  url: string | null;
  identityId: string | null;
  username: string | null;
  ethereumAddress: string | null;
  solanaAddress: string | null;
};

/** Shareable send deep link with this user's reversible wallet identity. */
export function useReceiveAddressUrl(): ReceiveAddressUrlResult {
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
      return qrData;
    }
    if (!identityId) {
      return null;
    }

    return createShareableAppURL('send', { identity: identityId });
  }, [identityId, isPreview, qrData]);

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
