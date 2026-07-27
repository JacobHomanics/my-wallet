import { useCallback, useEffect, useState } from 'react';
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
import { useTokenBalances } from '@/hooks/useTokenBalances';
import {
  formatUsdValue,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';

function TokenRow({ token }: { token: OwnedToken }) {
  const usdLabel = formatUsdValue(token.usdValue);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [token.logoUrl]);

  const showLogo = Boolean(token.logoUrl) && !logoFailed;

  return (
    <View style={styles.tokenRow}>
      <View style={styles.tokenLeft}>
        {showLogo ? (
          <Image
            accessibilityIgnoresInvertColors
            onError={() => {
              setLogoFailed(true);
            }}
            source={{ uri: token.logoUrl! }}
            style={styles.tokenLogo}
          />
        ) : (
          <View style={styles.tokenLogoFallback}>
            <Text style={styles.tokenLogoFallbackText}>
              {token.symbol.slice(0, 1)}
            </Text>
          </View>
        )}
        <View style={styles.tokenText}>
          <Text style={styles.tokenSymbol} numberOfLines={1}>
            {token.symbol}
          </Text>
          <Text style={styles.tokenMeta} numberOfLines={1}>
            {token.networkLabel}
            {token.name && token.name !== token.symbol
              ? ` · ${token.name}`
              : ''}
          </Text>
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

export function TokenDetailsScreen() {
  const insets = useSafeAreaInsets();
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

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const totalLabel = formatUsdValue(totalUsd);
  const hasWallet = Boolean(ethereumAddress || solanaAddress);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topBar}>
        <BackButton accessibilityLabel="Back to home" />
        <Text style={styles.topBarTitle}>Token breakdown</Text>
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
            tokens.length === 0 ? styles.listEmpty : styles.listContent
          }
          data={tokens}
          keyExtractor={(item) => item.id}
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
          renderItem={({ item }) => <TokenRow token={item} />}
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
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tokenLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  tokenLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenLogoFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
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
