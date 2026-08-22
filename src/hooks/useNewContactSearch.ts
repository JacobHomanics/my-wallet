import { useCallback, useMemo } from 'react';

import { useAddContact } from '@/hooks/useAddContact';
import { useAppLayout } from '@/hooks/useAppLayout';
import { useContactSearch } from '@/hooks/useContactSearch';
import { useEnsResolve } from '@/hooks/useEnsResolve';
import { useFarcasterSearch } from '@/hooks/useFarcasterSearch';
import type { SendSearchTabId } from '@/hooks/useSendAdvancedSearchTab';
import { useSendSearchTab } from '@/hooks/useSendSearchTab';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useWalletBalanceSearch } from '@/hooks/useWalletBalanceSearch';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';

export type NewContactSearchRow = {
  key: string;
  label: string;
  subtitle: string | null;
  extraLines?: string[];
  avatarSeed: string;
  profilePhotoUrl?: string | null;
  selectable: boolean;
  showFarcasterBadge?: boolean;
  showEnsBadge?: boolean;
  onPress: () => void;
};

const PLACEHOLDERS: Record<SendSearchTabId, string> = {
  zitiCashbox: 'Username',
  farcaster: 'Farcaster username',
  ens: 'name.eth',
  wallets: 'Wallet address',
};

const ACCESSIBILITY_LABELS: Record<SendSearchTabId, string> = {
  zitiCashbox: 'Search by username',
  farcaster: 'Search Farcaster username',
  ens: 'ENS name',
  wallets: 'Wallet address',
};

const EMPTY_MESSAGES: Record<SendSearchTabId, string> = {
  zitiCashbox: 'No accounts found.',
  farcaster: 'No Farcaster users found.',
  ens: 'ENS name not found.',
  wallets:
    'This wallet resolved, but no token balances were found on the supported networks.',
};

/**
 * New-contact search: ZitiCashbox by default; Farcaster / ENS / Wallets when advanced.
 */
export function useNewContactSearch(onAdded: () => void) {
  const { isAdvanced } = useAppLayout();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const { selectedTab, setSelectedTab, onSelectTab } = useSendSearchTab();
  const tab = showAdvanced ? selectedTab : 'zitiCashbox';
  const { add, addFarcaster, addEns, addAddresses, isAdding, errorMessage } =
    useAddContact();
  const contacts = useContactSearch({ enabled: tab === 'zitiCashbox' });
  const farcaster = useFarcasterSearch(tab === 'farcaster' ? contacts.query : '');
  const ens = useEnsResolve(tab === 'ens' ? contacts.query : '');
  const wallet = useWalletBalanceSearch(tab === 'wallets' ? contacts.query : '');

  const toggleAdvancedSearch = useCallback(() => {
    if (showAdvanced) {
      setSelectedTab('zitiCashbox');
    }
    toggleAdvanced();
  }, [setSelectedTab, showAdvanced, toggleAdvanced]);

  const resultRows = useMemo((): NewContactSearchRow[] => {
    if (tab === 'zitiCashbox') {
      return contacts.results.map((item) => ({
        key: item.userId,
        label: item.label,
        subtitle: item.subtitle,
        avatarSeed: item.username ?? item.userId,
        profilePhotoUrl: item.profilePhotoUrl,
        selectable: Boolean(item.username || item.identityId) && !isAdding,
        onPress: () => {
          if (!item.username && !item.identityId) {
            return;
          }
          void (async () => {
            const ok = await add(item.userId);
            if (ok) {
              onAdded();
            }
          })();
        },
      }));
    }

    if (tab === 'farcaster') {
      return farcaster.results.map((hit) => ({
        key: String(hit.fid),
        label: hit.label,
        subtitle: hit.hasAddress ? hit.displayName : 'No verified wallet',
        avatarSeed: hit.username,
        profilePhotoUrl: hit.pfpUrl,
        selectable: hit.hasAddress && !isAdding,
        showFarcasterBadge: true,
        onPress: () => {
          if (!hit.hasAddress) {
            return;
          }
          void (async () => {
            const ok = await addFarcaster({
              farcasterFid: hit.fid,
              farcasterUsername: hit.username,
              farcasterPfpUrl: hit.pfpUrl,
              name: hit.displayName,
              evmAddress: hit.evmAddress,
              solanaAddress: hit.solanaAddress,
            });
            if (ok) {
              onAdded();
            }
          })();
        },
      }));
    }

    if (tab === 'ens') {
      if (!ens.result) {
        return [];
      }
      const hit = ens.result;
      return [
        {
          key: hit.name,
          label: hit.label,
          subtitle: hit.address,
          avatarSeed: hit.name,
          profilePhotoUrl: hit.avatarUrl,
          selectable: !isAdding,
          showEnsBadge: true,
          onPress: () => {
            void (async () => {
              const ok = await addEns({
                ensName: hit.name,
                evmAddress: hit.address,
                ensAvatarUrl: hit.avatarUrl,
              });
              if (ok) {
                onAdded();
              }
            })();
          },
        },
      ];
    }

    if (!wallet.result) {
      return [];
    }
    const hit = wallet.result;
    return [
      {
        key: `${hit.chain}:${hit.address}`,
        label: hit.totalUsdLabel ?? formatWalletAddress(hit.address, 8, 6),
        subtitle: hit.chain === 'ethereum' ? 'EVM wallet' : 'Solana wallet',
        extraLines: hit.balances.map(
          (balance) =>
            `${balance.networkLabel}: ${balance.balanceLabel}${
              balance.usdLabel ? ` (${balance.usdLabel})` : ''
            }`,
        ),
        avatarSeed: hit.address,
        selectable: !isAdding,
        onPress: () => {
          void (async () => {
            const ok = await addAddresses({
              evmAddress:
                hit.chain === 'ethereum' ? hit.address : undefined,
              solanaAddress:
                hit.chain === 'solana' ? hit.address : undefined,
            });
            if (ok) {
              onAdded();
            }
          })();
        },
      },
    ];
  }, [
    add,
    addAddresses,
    addEns,
    addFarcaster,
    contacts.results,
    ens.result,
    farcaster.results,
    isAdding,
    onAdded,
    tab,
    wallet.result,
  ]);

  const trimmed = contacts.query.trim();
  const isSearching =
    tab === 'zitiCashbox'
      ? contacts.isSearching
      : tab === 'farcaster'
        ? farcaster.isSearching
        : tab === 'ens'
          ? ens.isResolving
          : wallet.isSearching;
  const showEmpty =
    tab === 'zitiCashbox'
      ? contacts.showEmpty
      : tab === 'farcaster'
        ? farcaster.showEmpty
        : tab === 'ens'
          ? ens.showNotFound
          : wallet.showEmpty;
  const searchError =
    tab === 'zitiCashbox'
      ? null
      : tab === 'farcaster'
        ? farcaster.errorMessage
        : tab === 'ens'
          ? ens.errorMessage
          : wallet.errorMessage;

  return {
    query: contacts.query,
    setQuery: contacts.setQuery,
    clearQuery: contacts.clearQuery,
    showTabs: showAdvanced,
    showAdvancedToggle: !isAdvanced,
    showAdvanced,
    selectedTab: tab,
    onSelectTab,
    toggleAdvancedSearch,
    placeholder: PLACEHOLDERS[tab],
    accessibilityLabel: ACCESSIBILITY_LABELS[tab],
    emptyMessage: EMPTY_MESSAGES[tab],
    errorMessage: errorMessage ?? searchError,
    isSearching,
    isAdding,
    showEmpty,
    showResults: Boolean(trimmed),
    resultRows,
  };
}
