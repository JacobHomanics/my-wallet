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
import { getPrivyEmbeddedWalletAddress } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * Embedded EVM + Solana wallets for the authenticated user (web).
 * Prefers connected wallets; falls back to linked Privy embedded accounts
 * (mobile web can create wallets before they show as connected).
 */
export function useUserWallets(): UserWalletsResult {
  const { ready, authenticated, user } = usePrivy();
  const { wallets: ethereumWallets, ready: ethereumReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  if (!ready || !authenticated || !user) {
    return { ready: false, wallets: [] };
  }

  // Surface linked wallets even if a chain's connector hook is still settling.
  const wallets: UserWallet[] = [];
  const seen = new Set<string>();

  const pushWallet = (chain: UserWallet['chain'], label: string, address: string) => {
    const key = `${chain}:${address}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    wallets.push({ chain, label, address });
  };

  if (ethereumReady) {
    const ethereum = getEmbeddedConnectedWallet(ethereumWallets);
    if (ethereum?.address) {
      pushWallet('ethereum', 'Ethereum', ethereum.address);
    }
  }

  const linkedEthereum = getPrivyEmbeddedWalletAddress(user, 'ethereum');
  if (linkedEthereum) {
    pushWallet('ethereum', 'Ethereum', linkedEthereum);
  }

  if (solanaReady) {
    for (const solana of solanaWallets) {
      if (!solana.address) {
        continue;
      }

      pushWallet('solana', 'Solana', solana.address);
    }
  }

  const linkedSolana = getPrivyEmbeddedWalletAddress(user, 'solana');
  if (linkedSolana) {
    pushWallet('solana', 'Solana', linkedSolana);
  }

  // Still warming connectors and no linked wallets yet — keep loading.
  if (!ethereumReady && !solanaReady && wallets.length === 0) {
    return { ready: false, wallets: [] };
  }

  return { ready: true, wallets };
}
