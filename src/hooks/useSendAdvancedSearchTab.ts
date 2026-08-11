import { useCallback, useState } from 'react';

export type SendAdvancedSearchTabId = 'farcaster' | 'ens' | 'wallets';

/**
 * Segmented tab state for Send advanced search (Farcaster / ENS / Wallets).
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

  const selectWallets = useCallback(() => {
    setSelectedTab('wallets');
  }, []);

  return {
    selectedTab,
    setSelectedTab,
    selectFarcaster,
    selectEns,
    selectWallets,
    isFarcasterTab: selectedTab === 'farcaster',
    isEnsTab: selectedTab === 'ens',
    isWalletsTab: selectedTab === 'wallets',
  };
}
