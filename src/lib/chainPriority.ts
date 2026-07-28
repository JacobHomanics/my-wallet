import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';

export type ChainPriorityId = 'evm' | 'solana';

export type ChainPriorityOption = {
  id: ChainPriorityId;
  label: string;
  description: string;
};

export const CHAIN_PRIORITY_OPTIONS: readonly ChainPriorityOption[] = [
  {
    id: 'evm',
    label: 'Prioritize EVM',
    description:
      'Use Ethereum and other EVM tokens before Solana when sending and sorting balances.',
  },
  {
    id: 'solana',
    label: 'Prioritize Solana',
    description:
      'Use Solana tokens before EVM when sending and sorting balances.',
  },
] as const;

export const DEFAULT_CHAIN_PRIORITY_ID: ChainPriorityId = 'evm';

export function getChainPriorityOption(
  id: ChainPriorityId,
): ChainPriorityOption | undefined {
  return CHAIN_PRIORITY_OPTIONS.find((option) => option.id === id);
}

export function getWalletChainForPriority(
  priority: ChainPriorityId,
): 'ethereum' | 'solana' {
  return priority === 'evm' ? 'ethereum' : 'solana';
}

/** Lower rank = higher priority. */
export function getChainFamilyRank(
  chain: 'ethereum' | 'solana',
  priority: ChainPriorityId,
): number {
  return chain === getWalletChainForPriority(priority) ? 0 : 1;
}

export function compareChainFamilies(
  a: 'ethereum' | 'solana',
  b: 'ethereum' | 'solana',
  priority: ChainPriorityId,
): number {
  const delta = getChainFamilyRank(a, priority) - getChainFamilyRank(b, priority);
  if (delta !== 0) {
    return delta;
  }
  return a.localeCompare(b);
}

export function partitionTokensByChainPriority(
  tokens: OwnedToken[],
  priority: ChainPriorityId,
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
