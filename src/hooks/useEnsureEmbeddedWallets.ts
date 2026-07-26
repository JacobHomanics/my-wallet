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

import { hasPrivyEmbeddedWallet } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

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
    if (
      !ready ||
      !authenticated ||
      !user ||
      !ethereumReady ||
      !solanaReady ||
      inFlightRef.current
    ) {
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

    inFlightRef.current = true;

    void (async () => {
      try {
        // Always create EVM before Solana.
        if (!hasEthereum) {
          await createEthereumWallet();
        }

        if (!hasSolana) {
          await createSolanaWallet();
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
