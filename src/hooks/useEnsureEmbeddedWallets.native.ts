import {
  isNotCreated,
  useEmbeddedEthereumWallet,
  useEmbeddedSolanaWallet,
  usePrivy,
} from '@privy-io/expo';
import { useEffect, useRef } from 'react';

import { hasPrivyEmbeddedWallet } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * After auth, ensure the user has embedded EVM then Solana wallets.
 * EVM must be created first — creating Solana first can permanently block EVM.
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 */
export function useEnsureEmbeddedWallets() {
  const { isReady, user } = usePrivy();
  const { wallets: ethereumWallets, create: createEthereumWallet } =
    useEmbeddedEthereumWallet();
  const solanaWallet = useEmbeddedSolanaWallet();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isReady || !user || inFlightRef.current) {
      return;
    }

    const needsEthereum =
      ethereumWallets.length === 0 &&
      !hasPrivyEmbeddedWallet(user, 'ethereum');
    const needsSolana =
      isNotCreated(solanaWallet) && !hasPrivyEmbeddedWallet(user, 'solana');

    if (!needsEthereum && !needsSolana) {
      return;
    }

    inFlightRef.current = true;

    void (async () => {
      try {
        // Always create EVM before Solana.
        if (needsEthereum) {
          await createEthereumWallet();
        }

        if (needsSolana && 'create' in solanaWallet) {
          await solanaWallet.create();
        }
      } catch (error) {
        console.error('Failed to ensure embedded wallets', error);
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [
    createEthereumWallet,
    ethereumWallets.length,
    isReady,
    solanaWallet,
    user,
  ]);
}
