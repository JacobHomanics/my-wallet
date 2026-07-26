import {
  getEmbeddedConnectedWallet,
  useCreateWallet as useCreateEthereumWallet,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import {
  useCreateWallet as useCreateSolanaWallet,
  useWallets as useSolanaWallets,
} from '@privy-io/react-auth/solana';
import { useEffect, useRef } from 'react';

import {
  hasPrivyEmbeddedWallet,
  isEmbeddedWalletAlreadyExistsError,
} from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * After auth, ensure the user has embedded EVM then Solana wallets.
 * Needed because whitelabel OTP login does not trigger createOnLogin.
 * EVM must be created first — creating Solana first can permanently block EVM.
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 */
export function useEnsureEmbeddedWallets() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets: ethereumWallets, ready: ethereumReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();
  const { createWallet: createEthereumWallet } = useCreateEthereumWallet();
  const { createWallet: createSolanaWallet } = useCreateSolanaWallet();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated || !user || inFlightRef.current) {
      return;
    }

    const hasEthereum =
      getEmbeddedConnectedWallet(ethereumWallets) != null ||
      hasPrivyEmbeddedWallet(user, 'ethereum');
    const hasSolana =
      solanaWallets.length > 0 || hasPrivyEmbeddedWallet(user, 'solana');

    if (hasEthereum && hasSolana) {
      return;
    }

    // Do not block EVM creation on Solana readiness (mobile web often lags).
    if (!hasEthereum && !ethereumReady) {
      return;
    }

    if (hasEthereum && !hasSolana && !solanaReady) {
      return;
    }

    inFlightRef.current = true;

    void (async () => {
      try {
        // Always create EVM before Solana.
        if (!hasEthereum) {
          try {
            await createEthereumWallet();
          } catch (error) {
            if (!isEmbeddedWalletAlreadyExistsError(error)) {
              throw error;
            }
          }
        }

        if (!hasSolana) {
          if (!solanaReady) {
            return;
          }

          try {
            await createSolanaWallet();
          } catch (error) {
            if (!isEmbeddedWalletAlreadyExistsError(error)) {
              throw error;
            }
          }
        }
      } catch (error) {
        console.error('Failed to ensure embedded wallets', error);
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [
    authenticated,
    createEthereumWallet,
    createSolanaWallet,
    ethereumReady,
    ethereumWallets,
    ready,
    solanaReady,
    solanaWallets,
    user,
  ]);
}
