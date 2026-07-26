type LinkedAccountLike = {
  type?: string;
  address?: string;
  chainType?: string;
  chain_type?: string;
  walletClientType?: string;
  wallet_client_type?: string;
  wallet_client?: string;
};

type UserLike = {
  linkedAccounts?: unknown;
  linked_accounts?: unknown;
};

function getLinkedAccounts(user: unknown): LinkedAccountLike[] {
  if (!user || typeof user !== 'object') {
    return [];
  }

  const typed = user as UserLike;
  // Web Privy uses camelCase; Expo api-types / js-sdk-core use snake_case.
  const linkedAccounts = typed.linkedAccounts ?? typed.linked_accounts;
  if (!Array.isArray(linkedAccounts)) {
    return [];
  }

  return linkedAccounts.filter(
    (account): account is LinkedAccountLike =>
      !!account && typeof account === 'object',
  );
}

function getAccountChainType(linked: LinkedAccountLike): string | undefined {
  return linked.chainType ?? linked.chain_type;
}

function getWalletClientType(linked: LinkedAccountLike): string | undefined {
  return (
    linked.walletClientType ??
    linked.wallet_client_type ??
    linked.wallet_client
  );
}

function isPrivyEmbeddedWallet(
  linked: LinkedAccountLike,
  chainType: 'ethereum' | 'solana',
): boolean {
  return (
    getAccountChainType(linked) === chainType &&
    getWalletClientType(linked) === 'privy'
  );
}

/**
 * Whether the Privy user already has an embedded wallet on the given chain.
 */
export function hasPrivyEmbeddedWallet(
  user: unknown,
  chainType: 'ethereum' | 'solana',
): boolean {
  return getLinkedAccounts(user).some((linked) =>
    isPrivyEmbeddedWallet(linked, chainType),
  );
}

/**
 * Address of the user's Privy embedded wallet on the given chain, if linked.
 */
export function getPrivyEmbeddedWalletAddress(
  user: unknown,
  chainType: 'ethereum' | 'solana',
): string | undefined {
  const linked = getLinkedAccounts(user).find(
    (account) =>
      isPrivyEmbeddedWallet(account, chainType) &&
      typeof account.address === 'string' &&
      account.address.length > 0,
  );

  return linked?.address;
}

/**
 * True when Privy reports the wallet already exists (safe to treat as success).
 */
export function isEmbeddedWalletAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : 'error' in error && typeof error.error === 'string'
        ? error.error
        : '';

  return /already exists/i.test(message);
}
