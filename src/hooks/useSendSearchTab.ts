import { useCallback, useState } from 'react';

import type { SendSearchTabId } from '@/hooks/useSendAdvancedSearchTab';

/**
 * Selected send-search tab (ZitiCashbox / Farcaster / ENS / Wallets).
 */
export function useSendSearchTab(initial: SendSearchTabId = 'zitiCashbox') {
  const [selectedTab, setSelectedTab] = useState<SendSearchTabId>(initial);

  const onSelectTab = useCallback((tab: SendSearchTabId) => {
    setSelectedTab(tab);
  }, []);

  return {
    selectedTab,
    setSelectedTab,
    onSelectTab,
    isZitiCashboxTab: selectedTab === 'zitiCashbox',
    isFarcasterTab: selectedTab === 'farcaster',
    isEnsTab: selectedTab === 'ens',
    isWalletsTab: selectedTab === 'wallets',
  };
}
