import { useCallback, useState } from 'react';

export type ContactsTabId = 'all' | 'contacts' | 'external';

/**
 * Segmented tab state for All / Contacts / External Contacts.
 */
export function useContactsTab(initial: ContactsTabId = 'all') {
  const [selectedTab, setSelectedTab] = useState<ContactsTabId>(initial);

  const selectAll = useCallback(() => {
    setSelectedTab('all');
  }, []);

  const selectContacts = useCallback(() => {
    setSelectedTab('contacts');
  }, []);

  const selectExternal = useCallback(() => {
    setSelectedTab('external');
  }, []);

  return {
    selectedTab,
    setSelectedTab,
    selectAll,
    selectContacts,
    selectExternal,
    isAllTab: selectedTab === 'all',
    isContactsTab: selectedTab === 'contacts',
    isExternalTab: selectedTab === 'external',
  };
}
