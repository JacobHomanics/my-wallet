import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';

import {
  type UserWallet,
  type UserWalletsResult,
} from '@/hooks/useUserWallets.shared';

/**
 * Embedded EVM + Solana wallets for the authenticated user (web).
 */
export function useUserWallets(): UserWalletsResult {
  const { ready, authenticated } = usePrivy();
  const { wallets: ethereumWallets, ready: ethereumReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  if (!ready || !authenticated || !ethereumReady || !solanaReady) {
    return { ready: false, wallets: [] };
  }

  const wallets: UserWallet[] = [];
  const ethereum = getEmbeddedConnectedWallet(ethereumWallets);
  if (ethereum?.address) {
    wallets.push({
      chain: 'ethereum',
      label: 'Ethereum',
      address: ethereum.address,
    });
  }

  for (const solana of solanaWallets) {
    if (!solana.address) {
      continue;
    }

    wallets.push({
      chain: 'solana',
      label: 'Solana',
      address: solana.address,
    });
  }

  return { ready: true, wallets };
}
