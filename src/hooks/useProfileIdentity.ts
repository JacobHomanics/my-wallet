import { useAuth } from '@/hooks/useAuth';

type LinkedAccountLike = {
  type?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  number?: string;
};

type UserLike = {
  id: string;
  email?: { address?: string } | null;
  phone?: { number?: string } | null;
  wallet?: { address?: string } | null;
  linkedAccounts?: LinkedAccountLike[] | null;
};

function truncateMiddle(value: string, start = 6, end = 4) {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function findLinkedAccount(user: UserLike, type: string) {
  return user.linkedAccounts?.find((account) => account.type === type);
}

/**
 * Resolves a short label + copyable identity from the Privy user
 * (wallet address, email, phone, or user id — Scaffold-ETH–style pill).
 */
export function useProfileIdentity() {
  const { user } = useAuth();
  const typedUser = user as UserLike | null;

  if (!typedUser) {
    return {
      displayName: 'Account',
      copyValue: '',
      copyLabel: 'Copy',
      avatarSeed: 'guest',
    };
  }

  const walletAddress =
    typedUser.wallet?.address ??
    findLinkedAccount(typedUser, 'wallet')?.address;
  if (walletAddress) {
    return {
      displayName: truncateMiddle(walletAddress),
      copyValue: walletAddress,
      copyLabel: 'Copy address',
      avatarSeed: walletAddress,
    };
  }

  const email =
    typedUser.email?.address ?? findLinkedAccount(typedUser, 'email')?.email;
  if (email) {
    return {
      displayName: email,
      copyValue: email,
      copyLabel: 'Copy email',
      avatarSeed: email,
    };
  }

  const phone =
    typedUser.phone?.number ??
    findLinkedAccount(typedUser, 'phone')?.phoneNumber ??
    findLinkedAccount(typedUser, 'phone')?.number;
  if (phone) {
    return {
      displayName: phone,
      copyValue: phone,
      copyLabel: 'Copy phone',
      avatarSeed: phone,
    };
  }

  return {
    displayName: truncateMiddle(typedUser.id, 8, 4),
    copyValue: typedUser.id,
    copyLabel: 'Copy user ID',
    avatarSeed: typedUser.id,
  };
}

export function getAvatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 48%, 42%)`;
}
