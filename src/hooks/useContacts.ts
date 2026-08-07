import { useQuery } from 'convex/react';
import { useMemo } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { encodeWalletIdentity } from '@/lib/walletIdentity';
import { api } from '../../convex/_generated/api';

export type ContactListItem = {
  id: string;
  username: string | null;
  name: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  identityId: string | null;
  label: string;
  subtitle: string | null;
  isExternal: boolean;
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

function resolveAccountNumber(
  identityId: string | null,
  evmAddress: string | null,
  solanaAddress: string | null,
): string | null {
  if (identityId?.trim()) {
    return identityId.trim();
  }

  const evm = evmAddress?.trim() ?? '';
  const solana = solanaAddress?.trim() ?? '';
  if (!evm || !solana) {
    return null;
  }

  try {
    return encodeWalletIdentity(evm, solana);
  } catch {
    return null;
  }
}

function buildContactLabel(params: {
  username: string | null;
  name: string | null;
  accountNumber: string | null;
  addressSubtitle: string | null;
}): string {
  if (params.username) {
    return `@${params.username}`;
  }
  if (params.accountNumber) {
    return formatWalletAddress(params.accountNumber, 10, 8);
  }
  if (params.name?.trim()) {
    return params.name.trim();
  }
  return params.addressSubtitle ?? 'Contact';
}

/**
 * Convex contacts for the authenticated Privy user.
 */
export function useContacts(): {
  contacts: ContactListItem[];
  userContacts: ContactListItem[];
  externalContacts: ContactListItem[];
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
      const username = row.username ?? null;
      const name = row.name ?? null;
      const evmAddress = row.evmAddress ?? null;
      const solanaAddress = row.solanaAddress ?? null;
      const identityId = row.identityId ?? null;
      // Platform contacts are linked users — never classify by username.
      const isExternal = row.contactUserId == null;
      const accountNumber = resolveAccountNumber(
        identityId,
        evmAddress,
        solanaAddress,
      );
      const addressSubtitle = buildAddressSubtitle(evmAddress, solanaAddress);

      return {
        id: row._id,
        username,
        name,
        evmAddress,
        solanaAddress,
        identityId: accountNumber,
        isExternal,
        label: buildContactLabel({
          username,
          name,
          accountNumber,
          addressSubtitle,
        }),
        subtitle: isExternal ? null : addressSubtitle,
      };
    });
  }, [rows]);

  const userContacts = useMemo(
    () => contacts.filter((contact) => !contact.isExternal),
    [contacts],
  );

  const externalContacts = useMemo(
    () => contacts.filter((contact) => contact.isExternal),
    [contacts],
  );

  return {
    contacts,
    userContacts,
    externalContacts,
    isLoading: externalId != null && rows === undefined,
  };
}
