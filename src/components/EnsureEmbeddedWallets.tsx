import { useEnsureEmbeddedWallets } from '@/hooks/useEnsureEmbeddedWallets';

/** Mounts wallet-creation ensure logic for authenticated users (EVM + Solana). */
export function EnsureEmbeddedWallets() {
  useEnsureEmbeddedWallets();
  return null;
}
