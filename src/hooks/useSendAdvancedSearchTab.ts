import { useCallback, useState } from 'react';

export type SendAdvancedSearchTabId =
  | 'farcaster'
  | 'ens'
  | 'names'
  | 'social'
  | 'wallets';

/**
 * Segmented tab state for Send advanced search.
 */
export function useSendAdvancedSearchTab(
  initial: SendAdvancedSearchTabId = 'farcaster',
) {
  const [selectedTab, setSelectedTab] =
    useState<SendAdvancedSearchTabId>(initial);

  const selectFarcaster = useCallback(() => {
    setSelectedTab('farcaster');
  }, []);

  const selectEns = useCallback(() => {
    setSelectedTab('ens');
  }, []);

  const selectNames = useCallback(() => {
    setSelectedTab('names');
  }, []);

  const selectSocial = useCallback(() => {
    setSelectedTab('social');
  }, []);

  const selectWallets = useCallback(() => {
    setSelectedTab('wallets');
  }, []);

  return {
    selectedTab,
    setSelectedTab,
    selectFarcaster,
    selectEns,
    selectNames,
    selectSocial,
    selectWallets,
    isFarcasterTab: selectedTab === 'farcaster',
    isEnsTab: selectedTab === 'ens',
    isNamesTab: selectedTab === 'names',
    isSocialTab: selectedTab === 'social',
    isWalletsTab: selectedTab === 'wallets',
  };
}
