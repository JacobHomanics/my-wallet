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
 * Resolves a short display label from the Privy user.
 * Prefer email/phone over wallet address for the profile pill.
 */
export function useProfileIdentity() {
  const { user } = useAuth();
  const typedUser = user as UserLike | null;

  if (!typedUser) {
    return {
      displayName: 'Account',
      avatarSeed: 'guest',
      email: null as string | null,
      phone: null as string | null,
    };
  }

  const email =
    typedUser.email?.address ??
    findLinkedAccount(typedUser, 'email')?.email ??
    null;
  const phone =
    typedUser.phone?.number ??
    findLinkedAccount(typedUser, 'phone')?.phoneNumber ??
    findLinkedAccount(typedUser, 'phone')?.number ??
    null;

  if (email) {
    return {
      displayName: email,
      avatarSeed: email,
      email,
      phone,
    };
  }

  if (phone) {
    return {
      displayName: phone,
      avatarSeed: phone,
      email,
      phone,
    };
  }

  const walletAddress =
    typedUser.wallet?.address ??
    findLinkedAccount(typedUser, 'wallet')?.address;
  if (walletAddress) {
    return {
      displayName: truncateMiddle(walletAddress),
      avatarSeed: walletAddress,
      email,
      phone,
    };
  }

  return {
    displayName: truncateMiddle(typedUser.id, 8, 4),
    avatarSeed: typedUser.id,
    email,
    phone,
  };
}

export function getAvatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  // Keep avatars in a green/teal range to match Ziti.
  const hue = 120 + (Math.abs(hash) % 60);
  return `hsl(${hue}, 42%, 38%)`;
}
