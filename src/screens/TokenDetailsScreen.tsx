import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { TokenChainSection } from '@/components/TokenChainSection';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useExpandedNetworks } from '@/hooks/useExpandedNetworks';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePollTokenBalances } from '@/hooks/usePollTokenBalances';
import { useSpendableTokens } from '@/hooks/useSpendableTokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useTokensByChain } from '@/hooks/useTokensByChain';
import type { TokenChainGroup } from '@/lib/alchemy/fetchTokensByAddress';
import type { HomeStackParamList } from '@/navigation/types';

export function TokenDetailsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const {
    ready,
    ethereumAddress,
    solanaAddress,
    tokens,
    totalUsd,
    loading,
    refreshing,
    error,
    refresh,
    poll,
  } = useTokenBalances();

  usePollTokenBalances(poll, {
    enabled: ready && Boolean(ethereumAddress || solanaAddress),
  });

  const { availableLabel } = useSpendableTokens(tokens);
  const chainGroups = useTokensByChain(tokens);
  const { expandedNetworks, isExpanded, toggleNetwork } = useExpandedNetworks();
  const { formatFromUsd, defaultFormattedZero } = useFiatDisplay();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const onTokenPress = useCallback(
    (tokenId: string) => {
      navigation.navigate('send', { tokenId });
    },
    [navigation],
  );

  const renderChainSection = useCallback(
    ({ item }: { item: TokenChainGroup }) => (
      <TokenChainSection
        group={item}
        expanded={isExpanded(item.network)}
        expandedNetworks={expandedNetworks}
        onToggle={() => {
          toggleNetwork(item.network);
        }}
        onToggleNetwork={toggleNetwork}
        onTokenPress={onTokenPress}
      />
    ),
    [expandedNetworks, isExpanded, onTokenPress, toggleNetwork],
  );

  const ledgerLabel = formatFromUsd(totalUsd) ?? defaultFormattedZero;
  const hasWallet = Boolean(ethereumAddress || solanaAddress);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to home"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                navigation.navigate('index');
              }}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to home"
              onPress={() => {
                navigation.navigate('index');
              }}
            />
          )}
          <Text style={styles.topBarTitle}>Balances</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.summary}>
          <View
            accessibilityLabel={`Available Balance: ${availableLabel}`}
            style={styles.balanceRow}
          >
            <Text style={styles.balanceLabel}>Available Balance:</Text>
            <Text style={styles.balanceValue}>{availableLabel}</Text>
          </View>
          <View
            accessibilityLabel={`Total Balance: ${ledgerLabel}`}
            style={styles.balanceRow}
          >
            <Text style={styles.balanceLabel}>Total Balance:</Text>
            <Text style={styles.balanceValue}>{ledgerLabel}</Text>
          </View>
        </View>

        {!hasWallet || loading ? (
          <ActivityIndicator color="#166534" style={styles.loader} />
        ) : error && tokens.length === 0 ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={
              chainGroups.length === 0 ? styles.listEmpty : styles.listContent
            }
            data={chainGroups}
            keyExtractor={(item) => item.network}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No tokens found on Ethereum or Solana.
              </Text>
            }
            ListHeaderComponent={
              error ? <Text style={styles.errorBanner}>{error}</Text> : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#166534"
              />
            }
            renderItem={renderChainSection}
            style={styles.list}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    minHeight: 0,
    overflow: 'hidden',
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
  summary: {
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
  },
  balanceValue: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
  errorBlock: {
    marginTop: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#b91c1c',
    textAlign: 'center',
  },
  errorBanner: {
    marginBottom: 12,
    fontSize: 13,
    color: '#b91c1c',
  },
  retryButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: '#f0fdf4',
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
    flexGrow: 1,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
});
