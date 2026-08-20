import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { useEnsResolve } from '@/hooks/useEnsResolve';
import { useFarcasterSearch } from '@/hooks/useFarcasterSearch';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useTier1Identity } from '@/hooks/useTier1Identity';
import {
  addRecentEnsSearch,
  addRecentFarcasterSearch,
  addRecentWalletSearch,
  useRecentAdvancedSearch,
  type RecentEnsSearch,
  type RecentFarcasterSearch,
  type RecentWalletSearch,
} from '@/hooks/useRecentAdvancedSearch';
import { useSendAdvancedSearchTab } from '@/hooks/useSendAdvancedSearchTab';
import { useWalletBalanceSearch } from '@/hooks/useWalletBalanceSearch';
import { useSendToContact } from '@/hooks/useSendToContact';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { Tier1ProtocolId } from '@/lib/identityProtocols';
import { TIER1_PROTOCOLS } from '@/lib/identityProtocols';
import type { HomeStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { webPressableMouseDownProps } from '@/hooks/useWebPressableMouseDown';

function AdvancedSearchTabChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tabChip, selected && styles.tabChipSelected]}
    >
      <Text style={[styles.tabChipText, selected && styles.tabChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProtocolChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.protocolChip, selected && styles.protocolChipSelected]}
    >
      <Text
        style={[
          styles.protocolChipText,
          selected && styles.protocolChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const NAME_PROTOCOLS: Tier1ProtocolId[] = ['basename', 'sns'];
const SOCIAL_PROTOCOLS: Tier1ProtocolId[] = ['lens', 'nostr'];

/**
 * Search Farcaster usernames, resolve ENS names, or enter wallet addresses during send.
 */
export function SendAdvancedSearchScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sendAdvancedSearch'>>();
  const { sendToContact } = useSendToContact();
  const [farcasterQuery, setFarcasterQuery] = useState('');
  const [ensQuery, setEnsQuery] = useState('');
  const [namesQuery, setNamesQuery] = useState('');
  const [socialQuery, setSocialQuery] = useState('');
  const [namesProtocol, setNamesProtocol] = useState<Tier1ProtocolId>('basename');
  const [socialProtocol, setSocialProtocol] = useState<Tier1ProtocolId>('lens');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { results, isSearching, showEmpty, errorMessage } =
    useFarcasterSearch(farcasterQuery);
  const [walletQuery, setWalletQuery] = useState('');
  const {
    result: ensResult,
    isResolving: isEnsResolving,
    showNotFound: ensNotFound,
    errorMessage: ensErrorMessage,
  } = useEnsResolve(ensQuery);
  const {
    result: walletResult,
    isSearching: isWalletSearching,
    showEmpty: walletEmpty,
    errorMessage: walletErrorMessage,
  } = useWalletBalanceSearch(walletQuery);
  const {
    selectFarcaster,
    selectEns,
    selectNames,
    selectSocial,
    selectWallets,
    isFarcasterTab,
    isEnsTab,
    isNamesTab,
    isSocialTab,
    isWalletsTab,
  } = useSendAdvancedSearchTab();
  const tier1Protocol = isNamesTab
    ? namesProtocol
    : isSocialTab
      ? socialProtocol
      : 'basename';
  const tier1Query = isNamesTab ? namesQuery : isSocialTab ? socialQuery : '';
  const {
    results: tier1Results,
    isSearching: isTier1Searching,
    showEmpty: tier1Empty,
    errorMessage: tier1ErrorMessage,
    config: tier1Config,
  } = useTier1Identity(tier1Protocol, tier1Query);
  const { recents: farcasterRecents } = useRecentAdvancedSearch('farcaster');
  const { recents: ensRecents } = useRecentAdvancedSearch('ens');
  const { recents: walletRecents } = useRecentAdvancedSearch('wallets');

  const tokenId = route.params?.tokenId;
  const usdAmount = route.params?.usdAmount;

  const showFarcasterRecents =
    isFarcasterTab &&
    isSearchFocused &&
    !farcasterQuery.trim() &&
    farcasterRecents.length > 0;
  const showEnsRecents =
    isEnsTab && isSearchFocused && !ensQuery.trim() && ensRecents.length > 0;
  const showWalletRecents =
    isWalletsTab &&
    isSearchFocused &&
    !walletQuery.trim() &&
    walletRecents.length > 0;

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('sendSearch', { tokenId, usdAmount });
  }, [navigation, tokenId, usdAmount]);

  const onSelectWallet = useCallback(() => {
    if (!walletResult) {
      return;
    }

    addRecentWalletSearch(walletResult);

    sendToContact(
      {
        identityId: null,
        evmAddress:
          walletResult.chain === 'ethereum' ? walletResult.address : null,
        solanaAddress:
          walletResult.chain === 'solana' ? walletResult.address : null,
        username: null,
        name: null,
        profilePhotoUrl: null,
      },
      { tokenId, usdAmount },
    );
  }, [
    sendToContact,
    tokenId,
    usdAmount,
    walletResult,
  ]);

  const onSelectFarcasterRecent = useCallback(
    (hit: RecentFarcasterSearch) => {
      const selectable = Boolean(hit.evmAddress || hit.solanaAddress);
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
          identityBadge: 'farcaster',
        },
        { tokenId, usdAmount },
      );
    },
    [sendToContact, tokenId, usdAmount],
  );

  const onSelectEnsRecent = useCallback(
    (hit: RecentEnsSearch) => {
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
          identityBadge: 'ens',
        },
        { tokenId, usdAmount },
      );
    },
    [sendToContact, tokenId, usdAmount],
  );

  const onSelectWalletRecent = useCallback(
    (hit: RecentWalletSearch) => {
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
        { tokenId, usdAmount },
      );
    },
    [sendToContact, tokenId, usdAmount],
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.topBar}>
            {isDesktopWeb ? (
              <Pressable
                accessibilityLabel="Back"
                accessibilityRole="button"
                hitSlop={8}
                onPress={goBack}
                style={({ pressed }) => [
                  styles.webBack,
                  pressed && styles.webBackPressed,
                ]}
              >
                <Text style={styles.webBackText}>Back</Text>
              </Pressable>
            ) : (
              <BackButton accessibilityLabel="Back" onPress={goBack} />
            )}
            <Text style={styles.topBarTitle}>Advanced search</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.tabs}>
            <AdvancedSearchTabChip
              label="Farcaster"
              selected={isFarcasterTab}
              onPress={selectFarcaster}
            />
            <AdvancedSearchTabChip
              label="ENS"
              selected={isEnsTab}
              onPress={selectEns}
            />
            <AdvancedSearchTabChip
              label="Names"
              selected={isNamesTab}
              onPress={selectNames}
            />
            <AdvancedSearchTabChip
              label="Social"
              selected={isSocialTab}
              onPress={selectSocial}
            />
            <AdvancedSearchTabChip
              label="Wallets"
              selected={isWalletsTab}
              onPress={selectWallets}
            />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.body,
              { paddingBottom: Math.max(insets.bottom, 24) + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isFarcasterTab ? (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    accessibilityLabel="Search Farcaster username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    onBlur={() => {
                      setIsSearchFocused(false);
                    }}
                    onChangeText={setFarcasterQuery}
                    onFocus={() => {
                      setIsSearchFocused(true);
                    }}
                    placeholder="Farcaster username"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.searchInput}
                    value={farcasterQuery}
                  />
                  {farcasterQuery.trim() ? (
                    <Pressable
                      accessibilityLabel="Clear Farcaster search"
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        setFarcasterQuery('');
                      }}
                      style={({ pressed }) => [
                        styles.clearSearchButton,
                        pressed && styles.clearSearchButtonPressed,
                      ]}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                {errorMessage ? (
                  <Text style={styles.error}>{errorMessage}</Text>
                ) : null}

                {showFarcasterRecents ? (
                  <View style={styles.results}>
                    <Text style={styles.sectionTitle}>Recents</Text>
                    {farcasterRecents.map((hit) => {
                      const selectable = Boolean(
                        hit.evmAddress || hit.solanaAddress,
                      );
                      return (
                        <Pressable
                          key={hit.id}
                          accessibilityLabel={`Select ${hit.username}`}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !selectable }}
                          disabled={!selectable}
                          onPress={() => {
                            onSelectFarcasterRecent(hit);
                          }}
                          {...webPressableMouseDownProps()}
                          style={({ pressed }) => [
                            styles.resultCard,
                            pressed && selectable && styles.resultCardPressed,
                            !selectable && styles.resultCardDisabled,
                          ]}
                        >
                          <Avatar
                            label={`@${hit.username}`}
                            photoUrl={hit.pfpUrl}
                            seed={hit.username}
                            size={40}
                            identityBadge="farcaster"
                          />
                          <View style={styles.resultText}>
                            <Text style={styles.resultLabel}>
                              @{hit.username}
                            </Text>
                            {!selectable ? (
                              <Text style={styles.resultDescription}>
                                No verified wallet
                              </Text>
                            ) : hit.displayName ? (
                              <Text style={styles.resultDescription}>
                                {hit.displayName}
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.textSubtle}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {isSearching ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : null}

                {results.length > 0 ? (
                  <View style={styles.results}>
                    {results.map((hit) => {
                      const selectable = hit.hasAddress;
                      return (
                        <Pressable
                          key={hit.fid}
                          accessibilityLabel={`Select ${hit.label}`}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !selectable }}
                          disabled={!selectable}
                          onPress={() => {
                            if (!selectable) {
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
                                identityBadge: 'farcaster',
                              },
                              { tokenId, usdAmount },
                            );
                          }}
                          style={({ pressed }) => [
                            styles.resultCard,
                            pressed && selectable && styles.resultCardPressed,
                            !selectable && styles.resultCardDisabled,
                          ]}
                        >
                          <Avatar
                            label={hit.label}
                            photoUrl={hit.pfpUrl}
                            seed={hit.username}
                            size={40}
                            identityBadge="farcaster"
                          />
                          <View style={styles.resultText}>
                            <Text style={styles.resultLabel}>{hit.label}</Text>
                            {!selectable ? (
                              <Text style={styles.resultDescription}>
                                No verified wallet
                              </Text>
                            ) : hit.displayName ? (
                              <Text style={styles.resultDescription}>
                                {hit.displayName}
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.textSubtle}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {showEmpty ? (
                  <Text style={styles.empty}>No Farcaster users found.</Text>
                ) : null}
              </>
            ) : null}

            {isEnsTab ? (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    accessibilityLabel="ENS name"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    onBlur={() => {
                      setIsSearchFocused(false);
                    }}
                    onChangeText={setEnsQuery}
                    onFocus={() => {
                      setIsSearchFocused(true);
                    }}
                    placeholder="name.eth"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.searchInput}
                    value={ensQuery}
                  />
                  {ensQuery.trim() ? (
                    <Pressable
                      accessibilityLabel="Clear ENS search"
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        setEnsQuery('');
                      }}
                      style={({ pressed }) => [
                        styles.clearSearchButton,
                        pressed && styles.clearSearchButtonPressed,
                      ]}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                {ensErrorMessage ? (
                  <Text style={styles.error}>{ensErrorMessage}</Text>
                ) : null}

                {showEnsRecents ? (
                  <View style={styles.results}>
                    <Text style={styles.sectionTitle}>Recents</Text>
                    {ensRecents.map((hit) => (
                      <Pressable
                        key={hit.id}
                        accessibilityLabel={`Select ${hit.name}`}
                        accessibilityRole="button"
                        onPress={() => {
                          onSelectEnsRecent(hit);
                        }}
                        {...webPressableMouseDownProps()}
                        style={({ pressed }) => [
                          styles.resultCard,
                          pressed && styles.resultCardPressed,
                        ]}
                      >
                        <Avatar
                          label={hit.name}
                          photoUrl={hit.avatarUrl}
                          seed={hit.name}
                          size={40}
                          identityBadge="ens"
                        />
                        <View style={styles.resultText}>
                          <Text style={styles.resultLabel}>{hit.name}</Text>
                          <Text style={styles.resultDescription}>
                            {hit.address}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSubtle}
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {isEnsResolving ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : null}

                {ensResult ? (
                  <Pressable
                    accessibilityLabel={`Select ${ensResult.label}`}
                    accessibilityRole="button"
                    onPress={() => {
                      addRecentEnsSearch(ensResult);
                      sendToContact(
                        {
                          identityId: null,
                          evmAddress: ensResult.address,
                          solanaAddress: null,
                          name: ensResult.name,
                          profilePhotoUrl: ensResult.avatarUrl,
                          identityBadge: 'ens',
                        },
                        { tokenId, usdAmount },
                      );
                    }}
                    style={({ pressed }) => [
                      styles.resultCard,
                      pressed && styles.resultCardPressed,
                    ]}
                  >
                    <Avatar
                      label={ensResult.label}
                      photoUrl={ensResult.avatarUrl}
                      seed={ensResult.name}
                      size={40}
                      identityBadge="ens"
                    />
                    <View style={styles.resultText}>
                      <Text style={styles.resultLabel}>{ensResult.label}</Text>
                      <Text style={styles.resultDescription}>
                        {ensResult.address}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
                  </Pressable>
                ) : null}

                {ensNotFound ? (
                  <Text style={styles.empty}>ENS name not found.</Text>
                ) : null}
              </>
            ) : null}

            {isNamesTab || isSocialTab ? (
              <>
                <View style={styles.protocolTabs}>
                  {(isNamesTab ? NAME_PROTOCOLS : SOCIAL_PROTOCOLS).map(
                    (protocol) => (
                      <ProtocolChip
                        key={protocol}
                        label={TIER1_PROTOCOLS[protocol].title}
                        selected={tier1Protocol === protocol}
                        onPress={() => {
                          if (isNamesTab) {
                            setNamesProtocol(protocol);
                          } else {
                            setSocialProtocol(protocol);
                          }
                        }}
                      />
                    ),
                  )}
                </View>
                <View style={styles.searchRow}>
                  <TextInput
                    accessibilityLabel={`Search ${tier1Config.title}`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    onChangeText={isNamesTab ? setNamesQuery : setSocialQuery}
                    placeholder={tier1Config.placeholder}
                    placeholderTextColor={colors.textSubtle}
                    style={styles.searchInput}
                    value={tier1Query}
                  />
                  {tier1Query.trim() ? (
                    <Pressable
                      accessibilityLabel={`Clear ${tier1Config.title} search`}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        if (isNamesTab) {
                          setNamesQuery('');
                        } else {
                          setSocialQuery('');
                        }
                      }}
                      style={({ pressed }) => [
                        styles.clearSearchButton,
                        pressed && styles.clearSearchButtonPressed,
                      ]}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.hint}>{tier1Config.hint}</Text>
                {tier1ErrorMessage ? (
                  <Text style={styles.error}>{tier1ErrorMessage}</Text>
                ) : null}

                {isTier1Searching ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : null}

                {tier1Results.length > 0 ? (
                  <View style={styles.results}>
                    {tier1Results.map((hit) => {
                      const selectable = hit.hasAddress;
                      return (
                        <Pressable
                          key={`${hit.protocol}:${hit.label}`}
                          accessibilityLabel={`Select ${hit.label}`}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !selectable }}
                          disabled={!selectable}
                          onPress={() => {
                            if (!selectable) {
                              return;
                            }
                            sendToContact(
                              {
                                identityId: null,
                                evmAddress: hit.evmAddress,
                                solanaAddress: hit.solanaAddress,
                                name: hit.label,
                                profilePhotoUrl: hit.avatarUrl,
                                identityBadge: hit.protocol,
                              },
                              { tokenId, usdAmount },
                            );
                          }}
                          style={({ pressed }) => [
                            styles.resultCard,
                            pressed && selectable && styles.resultCardPressed,
                            !selectable && styles.resultCardDisabled,
                          ]}
                        >
                          <Avatar
                            label={hit.label}
                            photoUrl={hit.avatarUrl}
                            seed={hit.label}
                            size={40}
                            identityBadge={hit.protocol}
                          />
                          <View style={styles.resultText}>
                            <Text style={styles.resultLabel}>{hit.label}</Text>
                            {!selectable ? (
                              <Text style={styles.resultDescription}>
                                No wallet address
                              </Text>
                            ) : hit.displayName ? (
                              <Text style={styles.resultDescription}>
                                {hit.displayName}
                              </Text>
                            ) : hit.evmAddress ? (
                              <Text style={styles.resultDescription}>
                                {formatWalletAddress(hit.evmAddress, 6, 4)}
                              </Text>
                            ) : hit.solanaAddress ? (
                              <Text style={styles.resultDescription}>
                                {formatWalletAddress(hit.solanaAddress, 6, 4)}
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.textSubtle}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {tier1Empty ? (
                  <Text style={styles.empty}>{tier1Config.emptyMessage}</Text>
                ) : null}
              </>
            ) : null}

            {isWalletsTab ? (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    accessibilityLabel="Wallet address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    onBlur={() => {
                      setIsSearchFocused(false);
                    }}
                    onChangeText={setWalletQuery}
                    onFocus={() => {
                      setIsSearchFocused(true);
                    }}
                    placeholder="Wallet address"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.searchInput}
                    value={walletQuery}
                  />
                  {walletQuery.trim() ? (
                    <Pressable
                      accessibilityLabel="Clear wallet search"
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        setWalletQuery('');
                      }}
                      style={({ pressed }) => [
                        styles.clearSearchButton,
                        pressed && styles.clearSearchButtonPressed,
                      ]}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                {walletErrorMessage ? (
                  <Text style={styles.error}>{walletErrorMessage}</Text>
                ) : null}

                {showWalletRecents ? (
                  <View style={styles.results}>
                    <Text style={styles.sectionTitle}>Recents</Text>
                    {walletRecents.map((hit) => (
                      <Pressable
                        key={hit.id}
                        accessibilityLabel={`Select wallet ${formatWalletAddress(hit.address, 6, 4)}`}
                        accessibilityRole="button"
                        onPress={() => {
                          onSelectWalletRecent(hit);
                        }}
                        {...webPressableMouseDownProps()}
                        style={({ pressed }) => [
                          styles.resultCard,
                          pressed && styles.resultCardPressed,
                        ]}
                      >
                        <Avatar
                          label={hit.address}
                          seed={hit.address}
                          size={40}
                        />
                        <View style={styles.resultText}>
                          <Text style={styles.resultLabel}>
                            {formatWalletAddress(hit.address, 8, 6)}
                          </Text>
                          <Text style={styles.resultDescription}>
                            {hit.chain === 'ethereum'
                              ? 'EVM wallet'
                              : 'Solana wallet'}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSubtle}
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {isWalletSearching ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : null}

                {walletResult ? (
                  <Pressable
                    accessibilityLabel={`Select wallet ${formatWalletAddress(walletResult.address, 6, 4)}`}
                    accessibilityRole="button"
                    onPress={onSelectWallet}
                    style={({ pressed }) => [
                      styles.resultCard,
                      pressed && styles.resultCardPressed,
                    ]}
                  >
                    <Avatar
                      label={walletResult.address}
                      seed={walletResult.address}
                      size={40}
                    />
                    <View style={styles.resultText}>
                      <Text style={styles.resultLabel}>
                        {walletResult.totalUsdLabel
                          ? walletResult.totalUsdLabel
                          : formatWalletAddress(walletResult.address, 8, 6)}
                      </Text>
                      <Text style={styles.resultDescription}>
                        {walletResult.chain === 'ethereum'
                          ? 'EVM wallet'
                          : 'Solana wallet'}
                      </Text>
                      {walletResult.balances.map((balance) => (
                        <Text
                          key={`${balance.network}:${balance.symbol}`}
                          style={styles.resultDescription}
                        >
                          {balance.networkLabel}: {balance.balanceLabel}
                          {balance.usdLabel ? ` (${balance.usdLabel})` : ''}
                        </Text>
                      ))}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
                  </Pressable>
                ) : null}

                {walletEmpty ? (
                  <View style={styles.walletCard}>
                    <View style={styles.walletGroup}>
                      <Text style={styles.fieldLabel}>No USDC found</Text>
                      <Text style={styles.hint}>
                        This wallet resolved, but no token balances were found on the supported networks.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: c.primary,
  },
  topBarSpacer: {
    width: 44,
  },
  webBack: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 4,
    gap: 4,
    backgroundColor: c.surfaceMuted,
    borderRadius: 12,
  },
  tabChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  tabChipSelected: {
    backgroundColor: c.surface,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textAlign: 'center',
  },
  tabChipTextSelected: {
    color: c.primary,
  },
  protocolTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  protocolChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: c.surfaceMuted,
  },
  protocolChipSelected: {
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
  },
  protocolChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
  },
  protocolChipTextSelected: {
    color: c.primary,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  input: {
    width: '100%',
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: c.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    color: c.primary,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchButtonPressed: {
    opacity: 0.7,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textSubtle,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: c.danger,
  },
  loader: {
    marginTop: 8,
  },
  results: {
    marginTop: 4,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultCardPressed: {
    opacity: 0.85,
    backgroundColor: c.bg,
  },
  resultCardDisabled: {
    opacity: 0.55,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  resultDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textMuted,
  },
  empty: {
    marginTop: 4,
    fontSize: 15,
    color: c.textSubtle,
    textAlign: 'center',
  },
  walletCard: {
    marginTop: 4,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  walletGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  walletInput: {
    fontSize: 15,
    color: c.primary,
    paddingVertical: 4,
  },
  inputError: {
    color: c.danger,
  },
  walletDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.rowBorder,
    marginHorizontal: 16,
  },
  });
}
