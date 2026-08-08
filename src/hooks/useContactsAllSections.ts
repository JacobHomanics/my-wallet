import { useCallback, useState } from 'react';

/**
 * Collapse state for the All-tab Contacts / Farcaster / External sections.
 */
export function useContactsAllSections(initialExpanded = true) {
  const [contactsExpanded, setContactsExpanded] = useState(initialExpanded);
  const [farcasterExpanded, setFarcasterExpanded] = useState(initialExpanded);
  const [externalExpanded, setExternalExpanded] = useState(initialExpanded);

  const toggleContacts = useCallback(() => {
    setContactsExpanded((open) => !open);
  }, []);

  const toggleFarcaster = useCallback(() => {
    setFarcasterExpanded((open) => !open);
  }, []);

  const toggleExternal = useCallback(() => {
    setExternalExpanded((open) => !open);
  }, []);

  return {
    contactsExpanded,
    farcasterExpanded,
    externalExpanded,
    toggleContacts,
    toggleFarcaster,
    toggleExternal,
  };
}
