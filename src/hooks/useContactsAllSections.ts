import { useCallback, useState } from 'react';

/**
 * Collapse state for All-tab Contacts / External Contacts group /
 * Wallets / wallet chains / Farcaster / ENS sections.
 */
export function useContactsAllSections(initialExpanded = true) {
  const [contactsExpanded, setContactsExpanded] = useState(initialExpanded);
  const [externalGroupExpanded, setExternalGroupExpanded] =
    useState(initialExpanded);
  const [walletsExpanded, setWalletsExpanded] = useState(initialExpanded);
  const [walletsEvmExpanded, setWalletsEvmExpanded] = useState(initialExpanded);
  const [walletsSolanaExpanded, setWalletsSolanaExpanded] =
    useState(initialExpanded);
  const [walletsMultiChainExpanded, setWalletsMultiChainExpanded] =
    useState(initialExpanded);
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

  const toggleWalletsEvm = useCallback(() => {
    setWalletsEvmExpanded((open) => !open);
  }, []);

  const toggleWalletsSolana = useCallback(() => {
    setWalletsSolanaExpanded((open) => !open);
  }, []);

  const toggleWalletsMultiChain = useCallback(() => {
    setWalletsMultiChainExpanded((open) => !open);
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
    walletsEvmExpanded,
    walletsSolanaExpanded,
    walletsMultiChainExpanded,
    farcasterExpanded,
    ensExpanded,
    toggleContacts,
    toggleExternalGroup,
    toggleWallets,
    toggleWalletsEvm,
    toggleWalletsSolana,
    toggleWalletsMultiChain,
    toggleFarcaster,
    toggleEns,
  };
}
