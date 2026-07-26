import {
  isNotCreated,
  useEmbeddedEthereumWallet,
  useEmbeddedSolanaWallet,
  usePrivy,
} from '@privy-io/expo';
import { useEffect, useRef } from 'react';

import {
  hasPrivyEmbeddedWallet,
  isEmbeddedWalletAlreadyExistsError,
} from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

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
          try {
            await createEthereumWallet();
          } catch (error) {
            if (!isEmbeddedWalletAlreadyExistsError(error)) {
              throw error;
            }
          }
        }

        if (needsSolana && 'create' in solanaWallet) {
          try {
            await solanaWallet.create();
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
    createEthereumWallet,
    ethereumWallets.length,
    isReady,
    solanaWallet,
    user,
  ]);
}
