import { useCallback, useState } from 'react';

/**
 * Collapse state for the All-tab Contacts / External Contacts sections.
 */
export function useContactsAllSections(initialExpanded = true) {
  const [contactsExpanded, setContactsExpanded] = useState(initialExpanded);
  const [externalExpanded, setExternalExpanded] = useState(initialExpanded);

  const toggleContacts = useCallback(() => {
    setContactsExpanded((open) => !open);
  }, []);

  const toggleExternal = useCallback(() => {
    setExternalExpanded((open) => !open);
  }, []);

  return {
    contactsExpanded,
    externalExpanded,
    toggleContacts,
    toggleExternal,
  };
}
