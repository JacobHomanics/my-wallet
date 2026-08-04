import { useUserWallets } from '@/hooks/useUserWallets';
import { computeWalletIdentityId } from '@/lib/walletIdentity';

/**
 * Reversible cross-chain identity id for the user's embedded EVM + Solana pair.
 */
export function useWalletIdentityId() {
  const { ready, wallets } = useUserWallets();
  const identityId = ready ? computeWalletIdentityId(wallets) : null;

  return {
    ready,
    identityId,
  };
}
