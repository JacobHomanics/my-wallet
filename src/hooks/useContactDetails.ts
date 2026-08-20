import { useQuery } from 'convex/react';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getContactIdentityBadge } from '@/lib/contactPresentation';
import { formatIdentityLabel } from '@/lib/identityProtocols';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export type ContactDetails = {
  id: string;
  username: string | null;
  name: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  identityId: string | null;
  profilePhotoUrl: string | null;
  farcasterFid: number | null;
  farcasterUsername: string | null;
  ensName: string | null;
  basename: string | null;
  lensHandle: string | null;
  snsDomain: string | null;
  nostrNip05: string | null;
  isExternal: boolean;
  isFarcaster: boolean;
  isEns: boolean;
  isBasename: boolean;
  isLens: boolean;
  isSns: boolean;
  isNostr: boolean;
  identityBadge: ReturnType<typeof getContactIdentityBadge>;
  title: string;
  label: string;
};

function buildTitle(params: {
  isEns: boolean;
  ensName: string | null;
  isBasename: boolean;
  basename: string | null;
  isLens: boolean;
  lensHandle: string | null;
  isSns: boolean;
  snsDomain: string | null;
  isNostr: boolean;
  nostrNip05: string | null;
  username: string | null;
  identityId: string | null;
  name: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
}): string {
  if (params.isEns && params.ensName) {
    return params.ensName;
  }
  if (params.isBasename && params.basename) {
    return formatIdentityLabel('basename', params.basename);
  }
  if (params.isLens && params.lensHandle) {
    return formatIdentityLabel('lens', params.lensHandle);
  }
  if (params.isSns && params.snsDomain) {
    return formatIdentityLabel('sns', params.snsDomain);
  }
  if (params.isNostr && params.nostrNip05) {
    return formatIdentityLabel('nostr', params.nostrNip05);
  }
  if (params.username) {
    return `@${params.username}`;
  }
  if (params.identityId) {
    return formatWalletAddress(params.identityId, 10, 8);
  }
  if (params.name) {
    return params.name;
  }
  if (params.evmAddress && !params.solanaAddress) {
    return formatWalletAddress(params.evmAddress, 10, 8);
  }
  if (params.solanaAddress && !params.evmAddress) {
    return formatWalletAddress(params.solanaAddress, 10, 8);
  }
  return 'Contact';
}

/**
 * Load a single owned contact for the details screen.
 */
export function useContactDetails(contactId: string | undefined): {
  contact: ContactDetails | null;
  isLoading: boolean;
  notFound: boolean;
} {
  const { userId, isLoading: userIdLoading } = useConvexUserId();

  const row = useQuery(
    api.contacts.getForOwner,
    userId && contactId
      ? {
          ownerId: userId,
          contactId: contactId as Id<'contacts'>,
        }
      : 'skip',
  );

  if (!userId || !contactId) {
    return {
      contact: null,
      isLoading: userIdLoading,
      notFound: !userIdLoading && !userId,
    };
  }

  if (row === undefined) {
    return { contact: null, isLoading: true, notFound: false };
  }

  if (row === null) {
    return { contact: null, isLoading: false, notFound: true };
  }

  const isFarcaster = Boolean(row.isFarcaster || row.farcasterFid != null);
  const isEns = Boolean(row.isEns || row.ensName?.trim());
  const isBasename = Boolean(row.isBasename || row.basename?.trim());
  const isLens = Boolean(row.isLens || row.lensAccount?.trim());
  const isSns = Boolean(row.isSns || row.snsDomain?.trim());
  const isNostr = Boolean(row.isNostr || row.nostrPubkey?.trim());
  const ensName = row.ensName?.trim() || null;
  const basename = row.basename?.trim() || null;
  const lensHandle = row.lensHandle?.trim() || null;
  const snsDomain = row.snsDomain?.trim() || null;
  const nostrNip05 = row.nostrNip05?.trim() || null;
  const username = isFarcaster
    ? (row.farcasterUsername ?? row.username)
    : row.username;
  const name = isEns ? ensName : row.name;
  const identityId = row.identityId;
  const evmAddress = row.evmAddress;
  const solanaAddress = row.solanaAddress;
  const title = buildTitle({
    isEns,
    ensName,
    isBasename,
    basename,
    isLens,
    lensHandle,
    isSns,
    snsDomain,
    isNostr,
    nostrNip05,
    username,
    identityId,
    name,
    evmAddress,
    solanaAddress,
  });

  const contactFlags = {
    isFarcaster,
    isEns,
    isBasename,
    isLens,
    isSns,
    isNostr,
  };

  return {
    contact: {
      id: row._id,
      username,
      name,
      evmAddress,
      solanaAddress,
      identityId,
      profilePhotoUrl: row.profilePhotoUrl ?? null,
      farcasterFid: row.farcasterFid ?? null,
      farcasterUsername: row.farcasterUsername ?? null,
      ensName,
      basename,
      lensHandle,
      snsDomain,
      nostrNip05,
      isExternal: Boolean(
        row.isExternal ??
          (!row.contactUserId &&
            !isFarcaster &&
            !isEns &&
            !isBasename &&
            !isLens &&
            !isSns &&
            !isNostr),
      ),
      ...contactFlags,
      identityBadge: getContactIdentityBadge(contactFlags),
      title,
      label: title,
    },
    isLoading: false,
    notFound: false,
  };
}
