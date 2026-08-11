import { useCallback, useState } from 'react';

/**
 * Collapse state for All-tab Contacts / External Contacts group /
 * Wallets / Farcaster / ENS sections.
 */
export function useContactsAllSections(initialExpanded = true) {
  const [contactsExpanded, setContactsExpanded] = useState(initialExpanded);
  const [externalGroupExpanded, setExternalGroupExpanded] =
    useState(initialExpanded);
  const [walletsExpanded, setWalletsExpanded] = useState(initialExpanded);
  const [farcasterExpanded, setFarcasterExpanded] = useState(initialExpanded);
  const [ensExpanded, setEnsExpanded] = useState(initialExpanded);

  const toggleContacts = useCallback(() => {
    setContactsExpanded((open) => !open);
  }, []);

  const toggleExternalGroup = useCallback(() => {
    setExternalGroupExpanded((open) => !open);
  }, []);

  const toggleWallets = useCallback(() => {
    setWalletsExpanded((open) => !open);
  }, []);

  const toggleFarcaster = useCallback(() => {
    setFarcasterExpanded((open) => !open);
  }, []);

  const toggleEns = useCallback(() => {
    setEnsExpanded((open) => !open);
  }, []);

  return {
    contactsExpanded,
    externalGroupExpanded,
    walletsExpanded,
    farcasterExpanded,
    ensExpanded,
    toggleContacts,
    toggleExternalGroup,
    toggleWallets,
    toggleFarcaster,
    toggleEns,
  };
}
