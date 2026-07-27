import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useDeposit } from '@/hooks/useDeposit';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { formatUsdValue } from '@/lib/alchemy/fetchTokensByAddress';
import type { HomeStackParamList } from '@/navigation/types';

export function HomeScreen() {
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
  } = useTokenBalances();
  const { deposit, canDeposit, isDepositing, error: depositError } =
    useDeposit();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const onDeposit = useCallback(() => {
    void deposit();
  }, [deposit]);

  const totalLabel = formatUsdValue(totalUsd) ?? '$0.00';
  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const showDetailsButton =
    ready && hasWallet && !(loading && tokens.length === 0);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0f172a"
        />
      }
      style={styles.container}
    >
      {!ready || loading ? (
        <ActivityIndicator color="#0f172a" />
      ) : !hasWallet ? (
        <Text style={styles.empty}>Creating your wallets…</Text>
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
        <>
          <Text style={styles.total} accessibilityRole="header">
            {totalLabel}
          </Text>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={!canDeposit || isDepositing}
            onPress={onDeposit}
            style={({ pressed }) => [
              styles.depositButton,
              (!canDeposit || isDepositing) && styles.depositButtonDisabled,
              pressed &&
                canDeposit &&
                !isDepositing &&
                styles.depositButtonPressed,
            ]}
          >
            {isDepositing ? (
              <ActivityIndicator color="#f8fafc" />
            ) : (
              <Text style={styles.depositButtonText}>Deposit</Text>
            )}
          </Pressable>
          {depositError ? (
            <Text style={styles.depositError}>{depositError}</Text>
          ) : null}
          {showDetailsButton ? (
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => {
                navigation.navigate('tokenDetails');
              }}
              style={({ pressed }) => [
                styles.detailsLink,
                pressed && styles.detailsLinkPressed,
              ]}
            >
              <Text style={styles.detailsLinkText}>Show advanced details</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  total: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  empty: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
  errorBlock: {
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
    marginTop: 12,
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
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
  depositButton: {
    marginTop: 24,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
  },
  depositButtonPressed: {
    opacity: 0.85,
  },
  depositButtonDisabled: {
    opacity: 0.5,
  },
  depositButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  depositError: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
    textAlign: 'center',
    maxWidth: 280,
  },
  detailsLink: {
    marginTop: 20,
    paddingVertical: 4,
  },
  detailsLinkPressed: {
    opacity: 0.6,
  },
  detailsLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});
