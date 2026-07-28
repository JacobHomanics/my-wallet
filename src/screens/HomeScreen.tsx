import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useOpenFreshSend } from '@/hooks/useOpenFreshSend';
import { useTokenBalances } from '@/hooks/useTokenBalances';
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

  const openFreshSend = useOpenFreshSend();
  const { formatFromUsd, defaultFormattedZero } = useFiatDisplay();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const totalLabel = formatFromUsd(totalUsd) ?? defaultFormattedZero;
  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const showActions =
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
      <View style={styles.hero}>
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
            {showActions ? (
              <>
                <View style={styles.actionsRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openFreshSend}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                  >
                    <Ionicons name="arrow-up" size={18} color="#f8fafc" />
                    <Text style={styles.actionButtonText}>Pay</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      navigation.navigate('receive');
                    }}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                  >
                    <Ionicons name="arrow-down" size={18} color="#f8fafc" />
                    <Text style={styles.actionButtonText}>Receive</Text>
                  </Pressable>
                </View>
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
                  <Text style={styles.detailsLinkText}>
                    Show advanced details
                  </Text>
                </Pressable>
              </>
            ) : null}
          </>
        )}
      </View>

      {showActions ? (
        <View style={styles.bottomLinks}>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => {
              navigation.navigate('transactions');
            }}
            style={({ pressed }) => [
              styles.bottomLink,
              pressed && styles.detailsLinkPressed,
            ]}
          >
            <Text style={styles.detailsLinkText}>Transactions</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => {
              navigation.navigate('contacts');
            }}
            style={({ pressed }) => [
              styles.bottomLink,
              pressed && styles.detailsLinkPressed,
            ]}
          >
            <Text style={styles.detailsLinkText}>Contacts</Text>
          </Pressable>
        </View>
      ) : null}
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionsRow: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
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
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  bottomLink: {
    paddingVertical: 4,
  },
});
