export type UserWallet = {
  chain: 'ethereum' | 'solana';
  label: string;
  address: string;
};

export type UserWalletsResult = {
  ready: boolean;
  wallets: UserWallet[];
};

export function formatWalletAddress(address: string, start = 6, end = 4) {
  if (address.length <= start + end + 3) {
    return address;
  }

  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
