import { useQuery } from 'convex/react';
import { useMemo } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

export type ContactListItem = {
  id: string;
  username: string;
  label: string;
};

/**
 * Convex contacts for the authenticated Privy user.
 */
export function useContacts(): {
  contacts: ContactListItem[];
  isLoading: boolean;
} {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;

  const rows = useQuery(
    api.contacts.listForOwner,
    externalId ? { ownerExternalId: externalId } : 'skip',
  );

  const contacts = useMemo((): ContactListItem[] => {
    if (!rows?.length) {
      return [];
    }

    return rows.map((row) => ({
      id: row._id,
      username: row.contactUsername,
      label: `@${row.contactUsername}`,
    }));
  }, [rows]);

  return {
    contacts,
    isLoading: externalId != null && rows === undefined,
  };
}
