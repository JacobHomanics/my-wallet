import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { TokenIcon } from '@/components/TokenIcon';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useTokensByChain } from '@/hooks/useTokensByChain';
import {
  formatUsdValue,
  UNKNOWN_TOKEN_NETWORK,
  type OwnedToken,
  type TokenChainGroup,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkIconUrl } from '@/lib/alchemy/networkIcons';
import type { RootStackParamList } from '@/navigation/types';

function TokenRow({ token }: { token: OwnedToken }) {
  const usdLabel = formatUsdValue(token.usdValue);

  return (
    <View style={styles.tokenRow}>
      <View style={styles.tokenLeft}>
        <TokenIcon
          logoUrl={token.logoUrl}
          network={token.network}
          showNetworkBadge={false}
          symbol={token.symbol}
        />
        <View style={styles.tokenText}>
          <Text style={styles.tokenSymbol} numberOfLines={1}>
            {token.symbol}
          </Text>
          {token.name && token.name !== token.symbol ? (
            <Text style={styles.tokenMeta} numberOfLines={1}>
              {token.name}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenBalance} numberOfLines={1}>
          {token.balanceFormatted}
        </Text>
        {usdLabel ? (
          <Text style={styles.tokenUsd} numberOfLines={1}>
            {usdLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ChainHeader({
  label,
  meta,
  usdLabel,
  iconUrl,
  iconFallback,
  expanded,
  onToggle,
  compact = false,
}: {
  label: string;
  meta: string;
  usdLabel: string | null;
  iconUrl: string | null;
  iconFallback: string;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = Boolean(iconUrl) && !iconFailed;

  useEffect(() => {
    setIconFailed(false);
  }, [iconUrl]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={({ pressed }) => [
        compact ? styles.nestedHeader : styles.chainHeader,
        pressed && styles.chainHeaderPressed,
      ]}
    >
      <View style={styles.chainHeaderLeft}>
        {showIcon ? (
          <View style={compact ? styles.nestedChainIcon : styles.chainIcon}>
            <Image
              accessibilityIgnoresInvertColors
              onError={() => {
                setIconFailed(true);
              }}
              source={{ uri: iconUrl! }}
              style={
                compact ? styles.nestedChainIconImage : styles.chainIconImage
              }
            />
          </View>
        ) : (
          <View
            style={
              compact ? styles.nestedChainIconFallback : styles.chainIconFallback
            }
          >
            <Text
              style={
                compact
                  ? styles.nestedChainIconFallbackText
                  : styles.chainIconFallbackText
              }
            >
              {iconFallback}
            </Text>
          </View>
        )}
        <View style={styles.chainHeaderText}>
          <Text style={compact ? styles.nestedLabel : styles.chainLabel}>
            {label}
          </Text>
          <Text style={styles.chainMeta}>{meta}</Text>
        </View>
      </View>
      <View style={styles.chainHeaderRight}>
        {usdLabel ? <Text style={styles.chainUsd}>{usdLabel}</Text> : null}
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={compact ? 14 : 16}
          color="#94a3b8"
        />
      </View>
    </Pressable>
  );
}

function ChainSection({
  group,
  expanded,
  onToggle,
  collapsedNetworks,
  onToggleNetwork,
}: {
  group: TokenChainGroup;
  expanded: boolean;
  onToggle: () => void;
  collapsedNetworks: Record<string, boolean>;
  onToggleNetwork: (key: string) => void;
}) {
  const isUnknown = group.network === UNKNOWN_TOKEN_NETWORK;
  const subgroups = group.subgroups ?? [];
  const chainUsd = formatUsdValue(group.totalUsd);
  const tokenCountLabel =
    group.tokens.length === 1 ? '1 token' : `${group.tokens.length} tokens`;

  return (
    <View style={styles.chainSection}>
      <ChainHeader
        label={group.networkLabel}
        meta={tokenCountLabel}
        usdLabel={chainUsd}
        iconUrl={isUnknown ? null : getNetworkIconUrl(group.network)}
        iconFallback={isUnknown ? '?' : group.networkLabel.slice(0, 1)}
        expanded={expanded}
        onToggle={onToggle}
      />

      {expanded ? (
        isUnknown && subgroups.length > 0 ? (
          <View style={styles.unknownSubgroups}>
            {subgroups.map((subgroup) => {
              const subgroupKey = `${UNKNOWN_TOKEN_NETWORK}:${subgroup.network}`;
              const subgroupExpanded = !collapsedNetworks[subgroupKey];
              const subgroupCount =
                subgroup.tokens.length === 1
                  ? '1 token'
                  : `${subgroup.tokens.length} tokens`;

              return (
                <View key={subgroup.network} style={styles.nestedSection}>
                  <ChainHeader
                    compact
                    label={subgroup.networkLabel}
                    meta={subgroupCount}
                    usdLabel={null}
                    iconUrl={getNetworkIconUrl(subgroup.network)}
                    iconFallback={subgroup.networkLabel.slice(0, 1)}
                    expanded={subgroupExpanded}
                    onToggle={() => {
                      onToggleNetwork(subgroupKey);
                    }}
                  />
                  {subgroupExpanded ? (
                    <View style={styles.chainTokens}>
                      {subgroup.tokens.map((token) => (
                        <TokenRow key={token.id} token={token} />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.chainTokens}>
            {group.tokens.map((token) => (
              <TokenRow key={token.id} token={token} />
            ))}
          </View>
        )
      ) : null}
      <View style={styles.chainDivider} />
    </View>
  );
}

export function TokenDetailsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    ethereumAddress,
    solanaAddress,
    tokens,
    totalUsd,
    loading,
    refreshing,
    error,
    refresh,
  } = useTokenBalances();
  const chainGroups = useTokensByChain(tokens);
  const [collapsedNetworks, setCollapsedNetworks] = useState<
    Record<string, boolean>
  >({});

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const toggleNetwork = useCallback((network: string) => {
    setCollapsedNetworks((current) => ({
      ...current,
      [network]: !current[network],
    }));
  }, []);

  const totalLabel = formatUsdValue(totalUsd);
  const hasWallet = Boolean(ethereumAddress || solanaAddress);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topBar}>
        {isDesktopWeb ? (
          <Pressable
            accessibilityLabel="Back to home"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              navigation.goBack();
            }}
            style={({ pressed }) => [
              styles.webBack,
              pressed && styles.webBackPressed,
            ]}
          >
            <Text style={styles.webBackText}>Back</Text>
          </Pressable>
        ) : (
          <BackButton accessibilityLabel="Back to home" />
        )}
        <Text style={styles.topBarTitle}>Balances</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {totalLabel ? <Text style={styles.total}>{totalLabel}</Text> : null}

      {!hasWallet || loading ? (
        <ActivityIndicator color="#0f172a" style={styles.loader} />
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
              tintColor="#0f172a"
            />
          }
          renderItem={({ item }) => (
            <ChainSection
              group={item}
              expanded={!collapsedNetworks[item.network]}
              collapsedNetworks={collapsedNetworks}
              onToggle={() => {
                toggleNetwork(item.network);
              }}
              onToggleNetwork={toggleNetwork}
            />
          )}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
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
    color: '#0f172a',
  },
  total: {
    paddingHorizontal: 24,
    marginBottom: 12,
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#94a3b8',
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
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  chainSection: {
    gap: 4,
  },
  chainDivider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
  unknownSubgroups: {
    gap: 8,
    paddingTop: 4,
    paddingLeft: 4,
  },
  nestedSection: {
    gap: 2,
  },
  nestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  nestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  nestedChainIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  nestedChainIconImage: {
    width: 18,
    height: 18,
  },
  nestedChainIconFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nestedChainIconFallbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  chainHeaderPressed: {
    opacity: 0.65,
  },
  chainHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  chainIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  chainIconImage: {
    width: 22,
    height: 22,
  },
  chainIconFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainIconFallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  chainHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  chainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  chainMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chainHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chainUsd: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    fontVariant: ['tabular-nums'],
  },
  chainTokens: {
    gap: 6,
    paddingLeft: 4,
    paddingTop: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  tokenLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  tokenText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  tokenMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  tokenRight: {
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: '42%',
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  tokenUsd: {
    fontSize: 13,
    color: '#64748b',
    fontVariant: ['tabular-nums'],
  },
});
