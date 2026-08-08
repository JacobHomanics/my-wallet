import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { useEffect, useRef } from 'react';

import { useCreateEmbeddedWallets } from '@/hooks/useCreateEmbeddedWallets';
import { useEnsureWalletSigners } from '@/hooks/useEnsureWalletSigners';
import { hasPrivyEmbeddedWallet } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

function isWalletProxyNotReadyError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error ?? '');
  return /wallet proxy not initialized/i.test(message);
}

/**
 * After auth, ensure embedded EVM + Solana wallets exist and the app
 * authorization key is added as a signer (for Convex server sends).
 *
 * Signer provisioning waits until Privy wallet connectors are ready —
 * calling `addSigners` too early throws "Wallet proxy not initialized".
 */
export function useEnsureEmbeddedWallets() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets: ethereumWallets, ready: ethereumReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();
  const { ensureEmbeddedWallets } = useCreateEmbeddedWallets();
  const { ensureWalletSigners } = useEnsureWalletSigners();
  const attemptedCreateForUserRef = useRef<string | null>(null);
  const signerSucceededKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      attemptedCreateForUserRef.current = null;
      signerSucceededKeyRef.current = null;
      return;
    }

    const hasBothLinked =
      hasPrivyEmbeddedWallet(user, 'ethereum') &&
      hasPrivyEmbeddedWallet(user, 'solana');

    if (!hasBothLinked) {
      if (attemptedCreateForUserRef.current === user.id) {
        return;
      }
      attemptedCreateForUserRef.current = user.id;

      void ensureEmbeddedWallets().catch((error) => {
        attemptedCreateForUserRef.current = null;
        console.error('Failed to ensure embedded wallets', error);
      });
      return;
    }

    // Wait for connected wallet clients — linked accounts alone are not enough.
    if (!ethereumReady || !solanaReady) {
      return;
    }

    const ethereum =
      getEmbeddedConnectedWallet(ethereumWallets) ?? ethereumWallets[0];
    const solana = solanaWallets[0];
    const addresses = [ethereum?.address, solana?.address].filter(
      (address): address is string => !!address,
    );

    if (addresses.length === 0) {
      return;
    }

    const attemptKey = `${user.id}:${addresses.slice().sort().join(',')}`;
    if (signerSucceededKeyRef.current === attemptKey) {
      return;
    }

    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    const maxAttempts = 8;

    const provision = () => {
      if (cancelled) {
        return;
      }
      attempt += 1;
      void ensureWalletSigners(addresses)
        .then(() => {
          if (!cancelled) {
            signerSucceededKeyRef.current = attemptKey;
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          if (
            isWalletProxyNotReadyError(error) &&
            attempt < maxAttempts
          ) {
            retryTimeout = setTimeout(provision, 500 * attempt);
            return;
          }
          if (!isWalletProxyNotReadyError(error)) {
            console.error('Failed to ensure wallet signers', error);
          }
        });
    };

    provision();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [
    authenticated,
    ensureEmbeddedWallets,
    ensureWalletSigners,
    ethereumReady,
    ethereumWallets,
    ready,
    solanaReady,
    solanaWallets,
    user,
  ]);
}
