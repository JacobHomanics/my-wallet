import { useQuery } from 'convex/react';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export type ContactDetails = {
  id: string;
  username: string | null;
  name: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  identityId: string | null;
  isExternal: boolean;
  title: string;
};

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

  const username = row.username;
  const name = row.name;
  const identityId = row.identityId;
  const title = username
    ? `@${username}`
    : identityId
      ? formatWalletAddress(identityId, 10, 8)
      : (name ?? 'Contact');

  return {
    contact: {
      id: row._id,
      username,
      name,
      evmAddress: row.evmAddress,
      solanaAddress: row.solanaAddress,
      identityId,
      isExternal: row.contactUserId == null,
      title,
    },
    isLoading: false,
    notFound: false,
  };
}
