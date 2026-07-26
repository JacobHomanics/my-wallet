import { usePrivy } from '@privy-io/expo';
import { useEffect, useRef } from 'react';

import { useCreateEmbeddedWallets } from '@/hooks/useCreateEmbeddedWallets';
import { hasPrivyEmbeddedWallet } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * After auth, ensure embedded EVM + Solana wallets exist (whitelabel OTP path).
 */
export function useEnsureEmbeddedWallets() {
  const { isReady, user } = usePrivy();
  const { ensureEmbeddedWallets } = useCreateEmbeddedWallets();
  const attemptedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady || !user) {
      attemptedForUserRef.current = null;
      return;
    }

    const hasBoth =
      hasPrivyEmbeddedWallet(user, 'ethereum') &&
      hasPrivyEmbeddedWallet(user, 'solana');
    if (hasBoth) {
      return;
    }

    if (attemptedForUserRef.current === user.id) {
      return;
    }

    attemptedForUserRef.current = user.id;

    void ensureEmbeddedWallets().catch((error) => {
      attemptedForUserRef.current = null;
      console.error('Failed to ensure embedded wallets', error);
    });
  }, [ensureEmbeddedWallets, isReady, user]);
}
