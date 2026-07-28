import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';

import {
  sortWalletsByChainPriority,
  type UserWallet,
  type UserWalletsResult,
} from '@/hooks/useUserWallets.shared';
import { getPrivyEmbeddedWalletAddress } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * Embedded EVM + Solana wallets for the authenticated user (web).
 * One address per chain (primary embedded / first linked).
 */
export function useUserWallets(): UserWalletsResult {
  const { ready, authenticated, user } = usePrivy();
  const { wallets: ethereumWallets, ready: ethereumReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  if (!ready || !authenticated || !user) {
    return { ready: false, wallets: [] };
  }

  const wallets: UserWallet[] = [];

  const ethereum =
    (ethereumReady
      ? getEmbeddedConnectedWallet(ethereumWallets)?.address ??
        ethereumWallets[0]?.address
      : undefined) ?? getPrivyEmbeddedWalletAddress(user, 'ethereum');
  if (ethereum) {
    wallets.push({ chain: 'ethereum', label: 'Ethereum', address: ethereum });
  }

  const solana =
    (solanaReady ? solanaWallets[0]?.address : undefined) ??
    getPrivyEmbeddedWalletAddress(user, 'solana');
  if (solana) {
    wallets.push({ chain: 'solana', label: 'Solana', address: solana });
  }

  if (!ethereumReady && !solanaReady && wallets.length === 0) {
    return { ready: false, wallets: [] };
  }

  return { ready: true, wallets: sortWalletsByChainPriority(wallets) };
}
