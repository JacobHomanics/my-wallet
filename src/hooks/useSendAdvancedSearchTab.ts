import { useCallback, useState } from 'react';

export type SendAdvancedSearchTabId = 'farcaster' | 'ens' | 'wallets';
export type SendSearchTabId = 'zitiCashbox' | SendAdvancedSearchTabId;

export function parseSendAdvancedSearchTab(
  value: string | undefined,
): SendAdvancedSearchTabId | undefined {
  if (value === 'farcaster' || value === 'ens' || value === 'wallets') {
    return value;
  }
  return undefined;
}

export function parseSendSearchTab(
  value: string | undefined,
): SendSearchTabId | undefined {
  if (value === 'zitiCashbox') {
    return value;
  }
  return parseSendAdvancedSearchTab(value);
}

/**
 * Segmented tab state for Send search (ZitiCashbox / Farcaster / ENS / Wallets).
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
