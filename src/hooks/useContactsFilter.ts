import { useCallback, useMemo, useState } from 'react';

import type { ContactListItem } from '@/hooks/useContacts';

function contactMatchesQuery(
  contact: ContactListItem,
  normalizedQuery: string,
): boolean {
  const haystacks = [
    contact.label,
    contact.subtitle,
    contact.username,
    contact.farcasterUsername,
    contact.name,
    contact.identityId,
    contact.evmAddress,
    contact.solanaAddress,
    contact.farcasterFid != null ? String(contact.farcasterFid) : null,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return haystacks.some((value) => value.includes(normalizedQuery));
}

/**
 * Search/filter state for the contacts list.
 */
export function useContactsFilter(contacts: {
  userContacts: ContactListItem[];
  farcasterContacts: ContactListItem[];
  externalContacts: ContactListItem[];
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredUserContacts = useMemo(() => {
    if (!normalizedQuery) {
      return contacts.userContacts;
    }

    return contacts.userContacts.filter((contact) =>
      contactMatchesQuery(contact, normalizedQuery),
    );
  }, [contacts.userContacts, normalizedQuery]);

  const filteredFarcasterContacts = useMemo(() => {
    if (!normalizedQuery) {
      return contacts.farcasterContacts;
    }

    return contacts.farcasterContacts.filter((contact) =>
      contactMatchesQuery(contact, normalizedQuery),
    );
  }, [contacts.farcasterContacts, normalizedQuery]);

  const filteredExternalContacts = useMemo(() => {
    if (!normalizedQuery) {
      return contacts.externalContacts;
    }

    return contacts.externalContacts.filter((contact) =>
      contactMatchesQuery(contact, normalizedQuery),
    );
  }, [contacts.externalContacts, normalizedQuery]);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const hasActiveQuery = normalizedQuery.length > 0;
  const hasFilteredResults =
    filteredUserContacts.length > 0 ||
    filteredFarcasterContacts.length > 0 ||
    filteredExternalContacts.length > 0;

  return {
    query,
    setQuery,
    clearQuery,
    filteredUserContacts,
    filteredFarcasterContacts,
    filteredExternalContacts,
    hasActiveQuery,
    hasFilteredResults,
  };
}
