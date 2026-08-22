import { useQuery } from 'convex/react';
import { useMemo } from 'react';

import { useContactsPreview } from '@/hooks/useContactsPreview';
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
  ensName: string | null;
  label: string;
  subtitle: string | null;
  isExternal: boolean;
  isFarcaster: boolean;
  isEns: boolean;
};

export type WalletContactChainGroup = {
  title: string;
  contacts: ContactListItem[];
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
  evmAddress: string | null;
  solanaAddress: string | null;
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
  if (params.evmAddress && !params.solanaAddress) {
    return formatWalletAddress(params.evmAddress, 10, 8);
  }
  if (params.solanaAddress && !params.evmAddress) {
    return formatWalletAddress(params.solanaAddress, 10, 8);
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
  ensContacts: ContactListItem[];
  externalContacts: ContactListItem[];
  isLoading: boolean;
  isPreview: boolean;
} {
  const preview = useContactsPreview();
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
      const isEns = Boolean(row.isEns || row.ensName?.trim());
      const ensName = row.ensName?.trim() || null;
      const username = isFarcaster
        ? (row.farcasterUsername ?? row.username ?? null)
        : (row.username ?? null);
      const name = isEns ? ensName : (row.name ?? null);
      const evmAddress = row.evmAddress ?? null;
      const solanaAddress = row.solanaAddress ?? null;
      const identityId = row.identityId ?? null;
      const isExternal = !row.contactUserId && !isFarcaster && !isEns;
      const accountNumber = resolveAccountNumber(
        identityId,
        evmAddress,
        solanaAddress,
      );
      const addressSubtitle = buildAddressSubtitle(evmAddress, solanaAddress);
      const label = isEns && ensName
        ? ensName
        : buildContactLabel({
            username,
            name,
            accountNumber,
            evmAddress,
            solanaAddress,
            addressSubtitle,
          });

      let subtitle: string | null = null;
      if (isFarcaster || isEns) {
        subtitle = null;
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
        ensName,
        isExternal,
        isFarcaster,
        isEns,
        label,
        subtitle,
      };
    });
  }, [rows]);

  const userContacts = useMemo(
    () =>
      contacts.filter(
        (contact) => !contact.isExternal && !contact.isFarcaster && !contact.isEns,
      ),
    [contacts],
  );

  const farcasterContacts = useMemo(
    () => contacts.filter((contact) => contact.isFarcaster),
    [contacts],
  );

  const ensContacts = useMemo(
    () => contacts.filter((contact) => contact.isEns),
    [contacts],
  );

  const externalContacts = useMemo(
    () => contacts.filter((contact) => contact.isExternal),
    [contacts],
  );

  if (preview.isPreview) {
    return {
      contacts: preview.contacts,
      userContacts: preview.userContacts,
      farcasterContacts: preview.farcasterContacts,
      ensContacts: preview.ensContacts,
      externalContacts: preview.externalContacts,
      isLoading: false,
      isPreview: true,
    };
  }

  return {
    contacts,
    userContacts,
    farcasterContacts,
    ensContacts,
    externalContacts,
    isLoading: userIdLoading || (userId != null && rows === undefined),
    isPreview: false,
  };
}

export function groupWalletContactsByChain(
  contacts: ContactListItem[],
): WalletContactChainGroup[] {
  const evm = contacts.filter(
    (contact) => Boolean(contact.evmAddress) && !contact.solanaAddress,
  );
  const solana = contacts.filter(
    (contact) => Boolean(contact.solanaAddress) && !contact.evmAddress,
  );
  const multiChain = contacts.filter(
    (contact) => Boolean(contact.evmAddress) && Boolean(contact.solanaAddress),
  );

  return [
    { title: 'EVM', contacts: evm },
    { title: 'Solana', contacts: solana },
    { title: 'Multi-chain', contacts: multiChain },
  ].filter((group) => group.contacts.length > 0);
}
