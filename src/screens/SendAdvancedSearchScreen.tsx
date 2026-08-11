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
import { useSendAdvancedSearchTab } from '@/hooks/useSendAdvancedSearchTab';
import { useSendToContact } from '@/hooks/useSendToContact';
import { useWalletUsdcSearch } from '@/hooks/useWalletUsdcSearch';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { HomeStackParamList } from '@/navigation/types';

function AdvancedSearchTabChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
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

/**
 * Search Farcaster usernames, resolve ENS names, or enter wallet addresses during send.
 */
export function SendAdvancedSearchScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sendAdvancedSearch'>>();
  const { sendToContact } = useSendToContact();
  const [farcasterQuery, setFarcasterQuery] = useState('');
  const [ensQuery, setEnsQuery] = useState('');
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
  } = useWalletUsdcSearch(walletQuery);
  const {
    selectFarcaster,
    selectEns,
    selectWallets,
    isFarcasterTab,
    isEnsTab,
    isWalletsTab,
  } = useSendAdvancedSearchTab();

  const tokenId = route.params?.tokenId;
  const usdAmount = route.params?.usdAmount;

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
                <TextInput
                  accessibilityLabel="Search Farcaster username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  onChangeText={setFarcasterQuery}
                  placeholder="Farcaster username"
                  placeholderTextColor="#86a894"
                  style={styles.input}
                  value={farcasterQuery}
                />
                <Text style={styles.hint}>
                  Search by Farcaster username to pay a verified wallet.
                </Text>

                {errorMessage ? (
                  <Text style={styles.error}>{errorMessage}</Text>
                ) : null}

                {isSearching ? (
                  <ActivityIndicator color="#166534" style={styles.loader} />
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
                            showFarcasterBadge
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
                            color="#86a894"
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
                <TextInput
                  accessibilityLabel="ENS name"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  onChangeText={setEnsQuery}
                  placeholder="name.eth"
                  placeholderTextColor="#86a894"
                  style={styles.input}
                  value={ensQuery}
                />
                <Text style={styles.hint}>
                  Resolve an ENS name to pay its Ethereum address.
                </Text>

                {ensErrorMessage ? (
                  <Text style={styles.error}>{ensErrorMessage}</Text>
                ) : null}

                {isEnsResolving ? (
                  <ActivityIndicator color="#166534" style={styles.loader} />
                ) : null}

                {ensResult ? (
                  <Pressable
                    accessibilityLabel={`Select ${ensResult.label}`}
                    accessibilityRole="button"
                    onPress={() => {
                      sendToContact(
                        {
                          identityId: null,
                          evmAddress: ensResult.address,
                          solanaAddress: null,
                          name: ensResult.name,
                          profilePhotoUrl: ensResult.avatarUrl,
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
                    />
                    <View style={styles.resultText}>
                      <Text style={styles.resultLabel}>{ensResult.label}</Text>
                      <Text style={styles.resultDescription}>
                        {ensResult.address}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#86a894" />
                  </Pressable>
                ) : null}

                {ensNotFound ? (
                  <Text style={styles.empty}>ENS name not found.</Text>
                ) : null}
              </>
            ) : null}

            {isWalletsTab ? (
              <>
                <TextInput
                  accessibilityLabel="Wallet address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  onChangeText={setWalletQuery}
                  placeholder="Wallet address"
                  placeholderTextColor="#86a894"
                  style={styles.input}
                  value={walletQuery}
                />
                <Text style={styles.hint}>
                  Search a wallet address and preview its USDC balances.
                </Text>

                {walletErrorMessage ? (
                  <Text style={styles.error}>{walletErrorMessage}</Text>
                ) : null}

                {isWalletSearching ? (
                  <ActivityIndicator color="#166534" style={styles.loader} />
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
                          ? `${walletResult.totalUsdLabel} USDC`
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
                    <Ionicons name="chevron-forward" size={18} color="#86a894" />
                  </Pressable>
                ) : null}

                {walletEmpty ? (
                  <View style={styles.walletCard}>
                    <View style={styles.walletGroup}>
                      <Text style={styles.fieldLabel}>No USDC found</Text>
                      <Text style={styles.hint}>
                        This wallet resolved, but no USDC balances were found on the supported networks.
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    color: '#166534',
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
    color: '#166534',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 4,
    gap: 4,
    backgroundColor: '#dcfce7',
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
    backgroundColor: '#ffffff',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textAlign: 'center',
  },
  tabChipTextSelected: {
    color: '#166534',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#166534',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
  },
  loader: {
    marginTop: 8,
  },
  results: {
    marginTop: 4,
    gap: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultCardPressed: {
    opacity: 0.85,
    backgroundColor: '#f0fdf4',
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
    color: '#166534',
  },
  resultDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
  },
  empty: {
    marginTop: 4,
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
  walletCard: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
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
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  walletInput: {
    fontSize: 15,
    color: '#166534',
    paddingVertical: 4,
  },
  inputError: {
    color: '#b91c1c',
  },
  walletDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginHorizontal: 16,
  },
});
