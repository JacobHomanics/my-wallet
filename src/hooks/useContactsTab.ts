import { useCallback, useState } from 'react';

export type ContactsTabId = 'all' | 'contacts' | 'farcaster' | 'external';

/**
 * Segmented tab state for All / Contacts / Farcaster / External.
 */
export function useContactsTab(initial: ContactsTabId = 'all') {
  const [selectedTab, setSelectedTab] = useState<ContactsTabId>(initial);

  const selectAll = useCallback(() => {
    setSelectedTab('all');
  }, []);

  const selectContacts = useCallback(() => {
    setSelectedTab('contacts');
  }, []);

  const selectFarcaster = useCallback(() => {
    setSelectedTab('farcaster');
  }, []);

  const selectExternal = useCallback(() => {
    setSelectedTab('external');
  }, []);

  return {
    selectedTab,
    setSelectedTab,
    selectAll,
    selectContacts,
    selectFarcaster,
    selectExternal,
    isAllTab: selectedTab === 'all',
    isContactsTab: selectedTab === 'contacts',
    isFarcasterTab: selectedTab === 'farcaster',
    isExternalTab: selectedTab === 'external',
  };
}
