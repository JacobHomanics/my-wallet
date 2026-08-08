import { useQuery } from 'convex/react';
import { useMemo } from 'react';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { encodeWalletIdentity } from '@/lib/walletIdentity';
import { api } from '../../convex/_generated/api';

export type ContactListItem = {
  id: string;
  username: string | null;
  name: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  identityId: string | null;
  profilePhotoUrl: string | null;
  farcasterFid: number | null;
  farcasterUsername: string | null;
  label: string;
  subtitle: string | null;
  isExternal: boolean;
  isFarcaster: boolean;
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
 * Convex contacts for the authenticated user.
 */
export function useContacts(): {
  contacts: ContactListItem[];
  userContacts: ContactListItem[];
  farcasterContacts: ContactListItem[];
  externalContacts: ContactListItem[];
  isLoading: boolean;
} {
  const { userId, isLoading: userIdLoading } = useConvexUserId();

  const rows = useQuery(
    api.contacts.listForOwner,
    userId ? { ownerId: userId } : 'skip',
  );

  const contacts = useMemo((): ContactListItem[] => {
    if (!rows?.length) {
      return [];
    }

    return rows.map((row) => {
      const isFarcaster = Boolean(row.isFarcaster || row.farcasterFid != null);
      const username = isFarcaster
        ? (row.farcasterUsername ?? row.username ?? null)
        : (row.username ?? null);
      const name = row.name ?? null;
      const evmAddress = row.evmAddress ?? null;
      const solanaAddress = row.solanaAddress ?? null;
      const identityId = row.identityId ?? null;
      const isExternal = !row.contactUserId && !isFarcaster;
      const accountNumber = resolveAccountNumber(
        identityId,
        evmAddress,
        solanaAddress,
      );
      const addressSubtitle = buildAddressSubtitle(evmAddress, solanaAddress);
      const label = buildContactLabel({
        username,
        name,
        accountNumber,
        addressSubtitle,
      });

      let subtitle: string | null = null;
      if (isFarcaster) {
        const parts = ['Farcaster'];
        if (addressSubtitle) {
          parts.push(addressSubtitle);
        }
        subtitle = parts.join(' · ');
      } else if (!isExternal) {
        subtitle = addressSubtitle;
      }

      return {
        id: row._id,
        username,
        name,
        evmAddress,
        solanaAddress,
        identityId: accountNumber,
        profilePhotoUrl: row.profilePhotoUrl ?? null,
        farcasterFid: row.farcasterFid ?? null,
        farcasterUsername: row.farcasterUsername ?? null,
        isExternal,
        isFarcaster,
        label,
        subtitle,
      };
    });
  }, [rows]);

  const userContacts = useMemo(
    () => contacts.filter((contact) => !contact.isExternal && !contact.isFarcaster),
    [contacts],
  );

  const farcasterContacts = useMemo(
    () => contacts.filter((contact) => contact.isFarcaster),
    [contacts],
  );

  const externalContacts = useMemo(
    () => contacts.filter((contact) => contact.isExternal),
    [contacts],
  );

  return {
    contacts,
    userContacts,
    farcasterContacts,
    externalContacts,
    isLoading: userIdLoading || (userId != null && rows === undefined),
  };
}
