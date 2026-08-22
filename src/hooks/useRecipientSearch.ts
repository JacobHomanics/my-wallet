import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppLayout } from '@/hooks/useAppLayout';
import type { ContactSearchHit } from '@/hooks/useContactSearch';
import { useEnsResolve } from '@/hooks/useEnsResolve';
import { useFarcasterSearch } from '@/hooks/useFarcasterSearch';
import {
  addRecentEnsSearch,
  addRecentFarcasterSearch,
  addRecentWalletSearch,
  useRecentAdvancedSearch,
} from '@/hooks/useRecentAdvancedSearch';
import { useRecentSendRecipients } from '@/hooks/useRecentSendRecipients';
import type { SendSearchTabId } from '@/hooks/useSendAdvancedSearchTab';
import { useSendSearchTab } from '@/hooks/useSendSearchTab';
import { useSendToContact } from '@/hooks/useSendToContact';
import { useWalletBalanceSearch } from '@/hooks/useWalletBalanceSearch';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { HomeStackParamList } from '@/navigation/types';

export type RecipientSearchRow = {
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

type RecipientSearchParams = {
  query: string;
  tokenId?: string;
  usdAmount?: string;
  contactResults: ContactSearchHit[];
  contactIsSearching: boolean;
  contactShowEmpty: boolean;
  isSearchFocused: boolean;
};

const PLACEHOLDERS: Record<SendSearchTabId, string> = {
  zitiCashbox: 'Username or account number',
  farcaster: 'Farcaster username',
  ens: 'name.eth',
  wallets: 'Wallet address',
};

const ACCESSIBILITY_LABELS: Record<SendSearchTabId, string> = {
  zitiCashbox: 'Search usernames or account numbers',
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
 * One recipient search field whose query, recents, and results follow the tab.
 */
export function useRecipientSearch({
  query,
  tokenId,
  usdAmount,
  contactResults,
  contactIsSearching,
  contactShowEmpty,
  isSearchFocused,
}: RecipientSearchParams) {
  const { isAdvanced } = useAppLayout();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { sendToContact } = useSendToContact();
  const { selectedTab, onSelectTab, isZitiCashboxTab } = useSendSearchTab();
  const tab = isAdvanced ? selectedTab : 'zitiCashbox';

  const farcaster = useFarcasterSearch(tab === 'farcaster' ? query : '');
  const ens = useEnsResolve(tab === 'ens' ? query : '');
  const wallet = useWalletBalanceSearch(tab === 'wallets' ? query : '');
  const { recents: zitiRecents } = useRecentSendRecipients();
  const { recents: farcasterRecents } = useRecentAdvancedSearch('farcaster');
  const { recents: ensRecents } = useRecentAdvancedSearch('ens');
  const { recents: walletRecents } = useRecentAdvancedSearch('wallets');

  const sendOptions = useMemo(
    () => ({ tokenId, usdAmount }),
    [tokenId, usdAmount],
  );

  const openAdvancedSearch = useCallback(() => {
    navigation.navigate('sendAdvancedSearch', { tokenId, usdAmount });
  }, [navigation, tokenId, usdAmount]);

  const resultRows = useMemo((): RecipientSearchRow[] => {
    if (tab === 'zitiCashbox') {
      return contactResults.map((item) => ({
        key: item.userId,
        label: item.label,
        subtitle: item.subtitle,
        avatarSeed: item.username ?? item.userId,
        profilePhotoUrl: item.profilePhotoUrl,
        selectable: Boolean(item.identityId),
        onPress: () => {
          if (!item.identityId) {
            return;
          }
          sendToContact(
            {
              identityId: item.identityId,
              evmAddress: null,
              solanaAddress: null,
              username: item.username,
              name: null,
              profilePhotoUrl: item.profilePhotoUrl,
            },
            sendOptions,
          );
        },
      }));
    }

    if (tab === 'farcaster') {
      return farcaster.results.map((hit) => ({
        key: String(hit.fid),
        label: hit.label,
        subtitle: hit.hasAddress
          ? hit.displayName
          : 'No verified wallet',
        avatarSeed: hit.username,
        profilePhotoUrl: hit.pfpUrl,
        selectable: hit.hasAddress,
        showFarcasterBadge: true,
        onPress: () => {
          if (!hit.hasAddress) {
            return;
          }
          addRecentFarcasterSearch(hit);
          sendToContact(
            {
              identityId: null,
              evmAddress: hit.evmAddress,
              solanaAddress: hit.solanaAddress,
              username: hit.username,
              name: hit.displayName,
              profilePhotoUrl: hit.pfpUrl,
              isFarcaster: true,
            },
            sendOptions,
          );
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
          selectable: true,
          showEnsBadge: true,
          onPress: () => {
            addRecentEnsSearch(hit);
            sendToContact(
              {
                identityId: null,
                evmAddress: hit.address,
                solanaAddress: null,
                name: hit.name,
                profilePhotoUrl: hit.avatarUrl,
                isEns: true,
              },
              sendOptions,
            );
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
        label:
          hit.totalUsdLabel ?? formatWalletAddress(hit.address, 8, 6),
        subtitle:
          hit.chain === 'ethereum' ? 'EVM wallet' : 'Solana wallet',
        extraLines: hit.balances.map(
          (balance) =>
            `${balance.networkLabel}: ${balance.balanceLabel}${
              balance.usdLabel ? ` (${balance.usdLabel})` : ''
            }`,
        ),
        avatarSeed: hit.address,
        selectable: true,
        onPress: () => {
          addRecentWalletSearch(hit);
          sendToContact(
            {
              identityId: null,
              evmAddress: hit.chain === 'ethereum' ? hit.address : null,
              solanaAddress: hit.chain === 'solana' ? hit.address : null,
              username: null,
              name: null,
              profilePhotoUrl: null,
            },
            sendOptions,
          );
        },
      },
    ];
  }, [
    contactResults,
    ens.result,
    farcaster.results,
    sendOptions,
    sendToContact,
    tab,
    wallet.result,
  ]);

  const recentRows = useMemo((): RecipientSearchRow[] => {
    if (tab === 'zitiCashbox') {
      return zitiRecents.map((item) => {
        const selectable = Boolean(
          item.identityId || item.evmAddress || item.solanaAddress,
        );
        return {
          key: item.id,
          label: item.label,
          subtitle: item.subtitle,
          avatarSeed: item.username ?? item.id,
          profilePhotoUrl: item.profilePhotoUrl,
          selectable,
          showFarcasterBadge: item.isFarcaster,
          showEnsBadge: item.isEns,
          onPress: () => {
            if (!selectable) {
              return;
            }
            sendToContact(
              {
                identityId: item.identityId,
                evmAddress: item.evmAddress,
                solanaAddress: item.solanaAddress,
                username: item.username,
                name: item.name,
                profilePhotoUrl: item.profilePhotoUrl,
                isFarcaster: item.isFarcaster,
                isEns: item.isEns,
              },
              sendOptions,
            );
          },
        };
      });
    }

    if (tab === 'farcaster') {
      return farcasterRecents.map((hit) => {
        const selectable = Boolean(hit.evmAddress || hit.solanaAddress);
        return {
          key: hit.id,
          label: `@${hit.username}`,
          subtitle: selectable
            ? hit.displayName
            : 'No verified wallet',
          avatarSeed: hit.username,
          profilePhotoUrl: hit.pfpUrl,
          selectable,
          showFarcasterBadge: true,
          onPress: () => {
            if (!selectable) {
              return;
            }
            addRecentFarcasterSearch({
              fid: hit.fid,
              username: hit.username,
              displayName: hit.displayName,
              pfpUrl: hit.pfpUrl,
              evmAddress: hit.evmAddress,
              solanaAddress: hit.solanaAddress,
              label: `@${hit.username}`,
              hasAddress: selectable,
            });
            sendToContact(
              {
                identityId: null,
                evmAddress: hit.evmAddress,
                solanaAddress: hit.solanaAddress,
                username: hit.username,
                name: hit.displayName,
                profilePhotoUrl: hit.pfpUrl,
                isFarcaster: true,
              },
              sendOptions,
            );
          },
        };
      });
    }

    if (tab === 'ens') {
      return ensRecents.map((hit) => ({
        key: hit.id,
        label: hit.name,
        subtitle: hit.address,
        avatarSeed: hit.name,
        profilePhotoUrl: hit.avatarUrl,
        selectable: true,
        showEnsBadge: true,
        onPress: () => {
          addRecentEnsSearch({
            name: hit.name,
            address: hit.address,
            avatarUrl: hit.avatarUrl,
            label: hit.name,
          });
          sendToContact(
            {
              identityId: null,
              evmAddress: hit.address,
              solanaAddress: null,
              name: hit.name,
              profilePhotoUrl: hit.avatarUrl,
              isEns: true,
            },
            sendOptions,
          );
        },
      }));
    }

    return walletRecents.map((hit) => ({
      key: hit.id,
      label: formatWalletAddress(hit.address, 8, 6),
      subtitle: hit.chain === 'ethereum' ? 'EVM wallet' : 'Solana wallet',
      avatarSeed: hit.address,
      selectable: true,
      onPress: () => {
        addRecentWalletSearch({
          address: hit.address,
          chain: hit.chain,
          balances: [],
          totalUsdLabel: null,
        });
        sendToContact(
          {
            identityId: null,
            evmAddress: hit.chain === 'ethereum' ? hit.address : null,
            solanaAddress: hit.chain === 'solana' ? hit.address : null,
            username: null,
            name: null,
            profilePhotoUrl: null,
          },
          sendOptions,
        );
      },
    }));
  }, [
    ensRecents,
    farcasterRecents,
    sendOptions,
    sendToContact,
    tab,
    walletRecents,
    zitiRecents,
  ]);

  const trimmed = query.trim();
  const isSearching =
    tab === 'zitiCashbox'
      ? contactIsSearching
      : tab === 'farcaster'
        ? farcaster.isSearching
        : tab === 'ens'
          ? ens.isResolving
          : wallet.isSearching;
  const showEmpty =
    tab === 'zitiCashbox'
      ? contactShowEmpty
      : tab === 'farcaster'
        ? farcaster.showEmpty
        : tab === 'ens'
          ? ens.showNotFound
          : wallet.showEmpty;
  const errorMessage =
    tab === 'zitiCashbox'
      ? null
      : tab === 'farcaster'
        ? farcaster.errorMessage
        : tab === 'ens'
          ? ens.errorMessage
          : wallet.errorMessage;

  return {
    showTabs: isAdvanced,
    selectedTab: tab,
    onSelectTab,
    isZitiCashboxTab: !isAdvanced || isZitiCashboxTab,
    openAdvancedSearch,
    placeholder: PLACEHOLDERS[tab],
    accessibilityLabel: ACCESSIBILITY_LABELS[tab],
    emptyMessage: EMPTY_MESSAGES[tab],
    errorMessage,
    isSearching,
    showEmpty,
    showResults: Boolean(trimmed),
    showRecents: isSearchFocused && !trimmed && recentRows.length > 0,
    recentRows,
    resultRows,
  };
}
