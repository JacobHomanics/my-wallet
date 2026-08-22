import { useMemo } from 'react';

import { useAuth } from '@/hooks/useAuth';
import type { ContactListItem } from '@/hooks/useContacts';
import { CONTACTS_PREVIEW } from '@/lib/contactsPreview';

const EMPTY_CONTACTS: ContactListItem[] = [];

/**
 * Signed-out contacts preview: sample people across app, Farcaster, ENS, and wallets.
 */
export function useContactsPreview(): {
  isPreview: boolean;
  contacts: ContactListItem[];
  userContacts: ContactListItem[];
  farcasterContacts: ContactListItem[];
  ensContacts: ContactListItem[];
  externalContacts: ContactListItem[];
} {
  const { isReady, isAuthenticated } = useAuth();
  const isPreview = isReady && !isAuthenticated;

  const contacts = isPreview ? CONTACTS_PREVIEW : EMPTY_CONTACTS;

  const userContacts = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          !contact.isExternal && !contact.isFarcaster && !contact.isEns,
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

  return {
    isPreview,
    contacts,
    userContacts,
    farcasterContacts,
    ensContacts,
    externalContacts,
  };
}
