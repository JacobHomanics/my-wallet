import {
  isConnected,
  useEmbeddedEthereumWallet,
  useEmbeddedSolanaWallet,
  usePrivy,
} from '@privy-io/expo';

import {
  sortWalletsByChainPriority,
  type UserWallet,
  type UserWalletsResult,
} from '@/hooks/useUserWallets.shared';
import { useChainPriority } from '@/hooks/useChainPriority';
import { getPrivyEmbeddedWalletAddress } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * Embedded EVM + Solana wallets for the authenticated user (native).
 * One address per chain (primary embedded / first linked).
 */
export function useUserWallets(): UserWalletsResult {
  const { selectedChainPriorityId } = useChainPriority();
  const { isReady, user } = usePrivy();
  const { wallets: ethereumWallets } = useEmbeddedEthereumWallet();
  const solanaWallet = useEmbeddedSolanaWallet();

  if (!isReady || !user) {
    return { ready: false, wallets: [] };
  }

  const wallets: UserWallet[] = [];

  const ethereum =
    ethereumWallets[0]?.address ??
    getPrivyEmbeddedWalletAddress(user, 'ethereum');
  if (ethereum) {
    wallets.push({ chain: 'ethereum', label: 'Ethereum', address: ethereum });
  }

  const solanaConnected =
    isConnected(solanaWallet) && solanaWallet.wallets[0]?.address
      ? solanaWallet.wallets[0].address
      : undefined;
  const solana =
    solanaConnected ?? getPrivyEmbeddedWalletAddress(user, 'solana');
  if (solana) {
    wallets.push({ chain: 'solana', label: 'Solana', address: solana });
  }

  return {
    ready: true,
    wallets: sortWalletsByChainPriority(wallets, selectedChainPriorityId),
  };
}
