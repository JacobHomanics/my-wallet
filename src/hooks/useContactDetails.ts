import { useQuery } from 'convex/react';

import { useAuth } from '@/hooks/useAuth';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
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
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;

  const row = useQuery(
    api.contacts.getForOwner,
    externalId && contactId
      ? {
          ownerExternalId: externalId,
          contactId: contactId as Id<'contacts'>,
        }
      : 'skip',
  );

  if (!externalId || !contactId) {
    return { contact: null, isLoading: false, notFound: true };
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
