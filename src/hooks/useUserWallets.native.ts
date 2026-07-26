import {
  isConnected,
  useEmbeddedEthereumWallet,
  useEmbeddedSolanaWallet,
  usePrivy,
} from '@privy-io/expo';

import {
  type UserWallet,
  type UserWalletsResult,
} from '@/hooks/useUserWallets.shared';

/**
 * Embedded EVM + Solana wallets for the authenticated user (native).
 */
export function useUserWallets(): UserWalletsResult {
  const { isReady, user } = usePrivy();
  const { wallets: ethereumWallets } = useEmbeddedEthereumWallet();
  const solanaWallet = useEmbeddedSolanaWallet();

  if (!isReady || !user) {
    return { ready: false, wallets: [] };
  }

  const wallets: UserWallet[] = [];

  for (const ethereum of ethereumWallets) {
    if (!ethereum.address) {
      continue;
    }

    wallets.push({
      chain: 'ethereum',
      label: 'Ethereum',
      address: ethereum.address,
    });
  }

  if (isConnected(solanaWallet)) {
    for (const solana of solanaWallet.wallets) {
      if (!solana.address) {
        continue;
      }

      wallets.push({
        chain: 'solana',
        label: 'Solana',
        address: solana.address,
      });
    }
  }

  return { ready: true, wallets };
}
