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
import { getPrivyEmbeddedWalletAddress } from '@/lib/privy/wallets/hasPrivyEmbeddedWallet';

/**
 * Embedded EVM + Solana wallets for the authenticated user (native).
 * Prefers connected wallets; falls back to linked Privy embedded accounts.
 */
export function useUserWallets(): UserWalletsResult {
  const { isReady, user } = usePrivy();
  const { wallets: ethereumWallets } = useEmbeddedEthereumWallet();
  const solanaWallet = useEmbeddedSolanaWallet();

  if (!isReady || !user) {
    return { ready: false, wallets: [] };
  }

  const wallets: UserWallet[] = [];
  const seen = new Set<string>();

  const pushWallet = (
    chain: UserWallet['chain'],
    label: string,
    address: string,
  ) => {
    const key = `${chain}:${address}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    wallets.push({ chain, label, address });
  };

  for (const ethereum of ethereumWallets) {
    if (!ethereum.address) {
      continue;
    }

    pushWallet('ethereum', 'Ethereum', ethereum.address);
  }

  const linkedEthereum = getPrivyEmbeddedWalletAddress(user, 'ethereum');
  if (linkedEthereum) {
    pushWallet('ethereum', 'Ethereum', linkedEthereum);
  }

  if (isConnected(solanaWallet)) {
    for (const solana of solanaWallet.wallets) {
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

  return { ready: true, wallets };
}
