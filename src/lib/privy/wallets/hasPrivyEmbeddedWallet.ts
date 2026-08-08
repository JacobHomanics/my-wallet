type LinkedAccountLike = {
  type?: string;
  id?: string | null;
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
  // Web Privy: camelCase. Expo / api-types: snake_case.
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

/** Whether the user already has a Privy embedded wallet on the given chain. */
export function hasPrivyEmbeddedWallet(
  user: unknown,
  chainType: 'ethereum' | 'solana',
): boolean {
  return getLinkedAccounts(user).some((linked) =>
    isPrivyEmbeddedWallet(linked, chainType),
  );
}

function getPrivyEmbeddedWalletAccount(
  user: unknown,
  chainType: 'ethereum' | 'solana',
): LinkedAccountLike | undefined {
  return getLinkedAccounts(user).find(
    (account) =>
      isPrivyEmbeddedWallet(account, chainType) &&
      typeof account.address === 'string' &&
      account.address.length > 0,
  );
}

/** Address of the user's Privy embedded wallet on the given chain, if linked. */
export function getPrivyEmbeddedWalletAddress(
  user: unknown,
  chainType: 'ethereum' | 'solana',
): string | undefined {
  return getPrivyEmbeddedWalletAccount(user, chainType)?.address;
}

/** Privy server wallet id for the embedded wallet on the given chain, if present. */
export function getPrivyEmbeddedWalletId(
  user: unknown,
  chainType: 'ethereum' | 'solana',
): string | undefined {
  const linked = getPrivyEmbeddedWalletAccount(user, chainType);
  if (typeof linked?.id === 'string' && linked.id.length > 0) {
    return linked.id;
  }
  return undefined;
}

/** True when Privy reports the wallet already exists (treat as success). */
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
