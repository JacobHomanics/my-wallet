import { useQuery } from 'convex/react';
import { useMemo } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

export type ContactListItem = {
  id: string;
  username: string | null;
  name: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  label: string;
  subtitle: string | null;
};

function buildAddressSubtitle(
  evmAddress: string | null,
  solanaAddress: string | null,
): string | null {
  const parts: string[] = [];
  if (evmAddress) {
    parts.push(`EVM ${formatWalletAddress(evmAddress, 6, 4)}`);
  }
  if (solanaAddress) {
    parts.push(`Solana ${formatWalletAddress(solanaAddress, 6, 4)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

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

    return rows.map((row) => {
      const username = row.contactUsername ?? null;
      const name = row.name ?? null;
      const evmAddress = row.evmAddress ?? null;
      const solanaAddress = row.solanaAddress ?? null;
      const addressSubtitle = buildAddressSubtitle(evmAddress, solanaAddress);

      return {
        id: row._id,
        username,
        name,
        evmAddress,
        solanaAddress,
        label: username ? `@${username}` : (name ?? addressSubtitle ?? 'Contact'),
        subtitle: username ? addressSubtitle : addressSubtitle,
      };
    });
  }, [rows]);

  return {
    contacts,
    isLoading: externalId != null && rows === undefined,
  };
}
