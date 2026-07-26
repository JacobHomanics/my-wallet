type LinkedAccountLike = {
  type?: string;
  chainType?: string;
  walletClientType?: string;
};

/**
 * Whether the Privy user already has an embedded wallet on the given chain.
 */
export function hasPrivyEmbeddedWallet(
  user: unknown,
  chainType: 'ethereum' | 'solana',
): boolean {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const linkedAccounts = (user as { linkedAccounts?: unknown }).linkedAccounts;
  if (!Array.isArray(linkedAccounts)) {
    return false;
  }

  return linkedAccounts.some((account) => {
    if (!account || typeof account !== 'object') {
      return false;
    }

    const linked = account as LinkedAccountLike;
    return linked.chainType === chainType && linked.walletClientType === 'privy';
  });
}
