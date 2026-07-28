import { compareChainFamilies, type ChainPriorityId } from '@/lib/chainPriority';

export type UserWallet = {
  chain: 'ethereum' | 'solana';
  label: string;
  address: string;
};

export type UserWalletsResult = {
  ready: boolean;
  wallets: UserWallet[];
};

export function sortWalletsByChainPriority(
  wallets: UserWallet[],
  chainPriorityId: ChainPriorityId,
): UserWallet[] {
  return [...wallets].sort((a, b) =>
    compareChainFamilies(a.chain, b.chain, chainPriorityId),
  );
}

export function formatWalletAddress(address: string, start = 10, end = 8) {
  if (address.length <= start + end + 3) {
    return address;
  }

  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
