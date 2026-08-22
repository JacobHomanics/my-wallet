import { useQuery } from 'convex/react';

import { useContactsPreview } from '@/hooks/useContactsPreview';
import { useConvexUserId } from '@/hooks/useConvexUserId';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { CONTACTS_PREVIEW } from '@/lib/contactsPreview';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { ContactListItem } from '@/hooks/useContacts';

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
  isExternal: boolean;
  isFarcaster: boolean;
  isEns: boolean;
  title: string;
};

/**
 * Load a single owned contact for the details screen.
 */
function detailsFromPreview(item: ContactListItem): ContactDetails {
  return {
    id: item.id,
    username: item.username,
    name: item.name,
    evmAddress: item.evmAddress,
    solanaAddress: item.solanaAddress,
    identityId: item.identityId,
    profilePhotoUrl: item.profilePhotoUrl,
    farcasterFid: item.farcasterFid,
    farcasterUsername: item.farcasterUsername,
    ensName: item.ensName,
    isExternal: item.isExternal,
    isFarcaster: item.isFarcaster,
    isEns: item.isEns,
    title: item.label,
  };
}

export function useContactDetails(contactId: string | undefined): {
  contact: ContactDetails | null;
  isLoading: boolean;
  notFound: boolean;
} {
  const { isPreview } = useContactsPreview();
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

  if (isPreview) {
    const preview = contactId
      ? CONTACTS_PREVIEW.find((item) => item.id === contactId)
      : undefined;
    return {
      contact: preview ? detailsFromPreview(preview) : null,
      isLoading: false,
      notFound: !preview,
    };
  }

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
  const ensName = row.ensName?.trim() || null;
  const username = isFarcaster
    ? (row.farcasterUsername ?? row.username)
    : row.username;
  const name = isEns ? ensName : row.name;
  const identityId = row.identityId;
  const evmAddress = row.evmAddress;
  const solanaAddress = row.solanaAddress;
  const title = isEns && ensName
    ? ensName
    : username
      ? `@${username}`
      : identityId
        ? formatWalletAddress(identityId, 10, 8)
        : name
          ? name
          : evmAddress && !solanaAddress
            ? formatWalletAddress(evmAddress, 10, 8)
            : solanaAddress && !evmAddress
              ? formatWalletAddress(solanaAddress, 10, 8)
              : 'Contact';

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
      isExternal: !row.contactUserId && !isFarcaster && !isEns,
      isFarcaster,
      isEns,
      title,
    },
    isLoading: false,
    notFound: false,
  };
}
