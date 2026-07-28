/**
 * App-wide chain priority: exhaust tokens on the preferred chain family
 * (EVM or Solana) before using the other chain for payments, ordering, and
 * wallet display.
 *
 * Override at build time with `EXPO_PUBLIC_CHAIN_PRIORITY=evm` or `solana`.
 */
import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
export type ChainPriority = 'evm' | 'solana';

export type ChainPriorityConfig = {
  priority: ChainPriority;
};

const DEFAULT_CHAIN_PRIORITY: ChainPriority = 'evm';

function readChainPriority(): ChainPriority {
  const raw = process.env.EXPO_PUBLIC_CHAIN_PRIORITY?.trim().toLowerCase();
  if (raw === 'solana') {
    return 'solana';
  }
  if (raw === 'evm' || raw === 'ethereum') {
    return 'evm';
  }
  return DEFAULT_CHAIN_PRIORITY;
}

export const CHAIN_PRIORITY_CONFIG: ChainPriorityConfig = {
  priority: readChainPriority(),
};

export function getChainPriority(): ChainPriority {
  return CHAIN_PRIORITY_CONFIG.priority;
}

export function getWalletChainForPriority(
  priority: ChainPriority = getChainPriority(),
): 'ethereum' | 'solana' {
  return priority === 'evm' ? 'ethereum' : 'solana';
}

/** Lower rank = higher priority. */
export function getChainFamilyRank(
  chain: 'ethereum' | 'solana',
  priority: ChainPriority = getChainPriority(),
): number {
  return chain === getWalletChainForPriority(priority) ? 0 : 1;
}

export function compareChainFamilies(
  a: 'ethereum' | 'solana',
  b: 'ethereum' | 'solana',
  priority: ChainPriority = getChainPriority(),
): number {
  const delta = getChainFamilyRank(a, priority) - getChainFamilyRank(b, priority);
  if (delta !== 0) {
    return delta;
  }
  return a.localeCompare(b);
}

export function partitionTokensByChainPriority(
  tokens: OwnedToken[],
  priority: ChainPriority = getChainPriority(),
): {
  preferred: OwnedToken[];
  fallback: OwnedToken[];
} {
  const preferredChain = getWalletChainForPriority(priority);
  const preferred: OwnedToken[] = [];
  const fallback: OwnedToken[] = [];

  for (const token of tokens) {
    if (getNetworkChain(token.network) === preferredChain) {
      preferred.push(token);
    } else {
      fallback.push(token);
    }
  }

  return { preferred, fallback };
}
