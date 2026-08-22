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
import { useChainPriority } from '@/hooks/useChainPriority';
import {
  getPrivyEmbeddedWalletAddress,
  getPrivyEmbeddedWalletId,
} from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * Embedded EVM + Solana wallets for the authenticated user (web).
 * One address per chain (primary embedded / first linked).
 */
export function useUserWallets(): UserWalletsResult {
  const { selectedChainPriorityId } = useChainPriority();
  const { ready, authenticated, user } = usePrivy();
  const { wallets: ethereumWallets, ready: ethereumReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  if (!ready) {
    return { ready: false, wallets: [] };
  }

  if (!authenticated || !user) {
    return { ready: true, wallets: [] };
  }

  const wallets: UserWallet[] = [];

  const ethereumEmbedded = ethereumReady
    ? getEmbeddedConnectedWallet(ethereumWallets) ?? ethereumWallets[0]
    : undefined;
  const ethereum =
    ethereumEmbedded?.address ??
    getPrivyEmbeddedWalletAddress(user, 'ethereum');
  if (ethereum) {
    const idFromWallet =
      ethereumEmbedded &&
      'id' in ethereumEmbedded &&
      typeof ethereumEmbedded.id === 'string'
        ? ethereumEmbedded.id
        : undefined;
    wallets.push({
      chain: 'ethereum',
      label: 'Ethereum',
      address: ethereum,
      id: idFromWallet ?? getPrivyEmbeddedWalletId(user, 'ethereum'),
    });
  }

  const solanaWallet = solanaReady ? solanaWallets[0] : undefined;
  const solana =
    solanaWallet?.address ?? getPrivyEmbeddedWalletAddress(user, 'solana');
  if (solana) {
    const idFromWallet =
      solanaWallet &&
      'id' in solanaWallet &&
      typeof solanaWallet.id === 'string'
        ? solanaWallet.id
        : undefined;
    wallets.push({
      chain: 'solana',
      label: 'Solana',
      address: solana,
      id: idFromWallet ?? getPrivyEmbeddedWalletId(user, 'solana'),
    });
  }

  if (!ethereumReady && !solanaReady && wallets.length === 0) {
    return { ready: false, wallets: [] };
  }

  return {
    ready: true,
    wallets: sortWalletsByChainPriority(wallets, selectedChainPriorityId),
  };
}
