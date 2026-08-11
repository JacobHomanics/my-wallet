import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePollTokenBalances } from '@/hooks/usePollTokenBalances';
import { useRewardTokenBalance } from '@/hooks/useRewardTokenBalance';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { getNetworkLabel } from '@/lib/alchemy/networks';
import {
  REWARD_POINTS_LABEL,
  REWARD_TOKEN_ADDRESS,
  REWARD_TOKEN_NETWORK,
} from '@/lib/rewardToken';

/**
 * Shows the user's Ziti Points balance earned from backend payments.
 */
export function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const {
    ready,
    ethereumAddress,
    solanaAddress,
    refreshing,
    refresh,
    poll,
  } = useTokenBalances();
  const {
    balanceFormatted: rewardBalance,
    loading: rewardLoading,
  } = useRewardTokenBalance();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();

  usePollTokenBalances(poll, {
    enabled: ready && Boolean(ethereumAddress || solanaAddress),
  });

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const loading = !ready || rewardLoading;
  const chainLabel = getNetworkLabel(REWARD_TOKEN_NETWORK);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topBarTitle}>Rewards</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D33D3D"
            />
          }
          style={styles.flex}
        >
          {loading ? (
          <ActivityIndicator color="#D33D3D" />
          ) : !hasWallet ? (
            <Text style={styles.empty}>Creating your wallets…</Text>
          ) : (
            <>
              <Text style={styles.balanceLabel}>{REWARD_POINTS_LABEL}</Text>
              <Text style={styles.balance} accessibilityRole="header">
                {rewardBalance}
              </Text>
              <Text style={styles.hint}>
                Earn {REWARD_POINTS_LABEL} when you pay through Ziti.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showAdvanced }}
                onPress={toggleAdvanced}
                style={({ pressed }) => [
                  styles.advancedToggle,
                  pressed && styles.advancedTogglePressed,
                ]}
              >
                <Text style={styles.advancedToggleText}>
                  {showAdvanced
                    ? 'Hide advanced details'
                    : 'Show advanced details'}
                </Text>
                <Ionicons
                  name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#9B5A5A"
                />
              </Pressable>

              {showAdvanced ? (
                <View style={styles.advanced}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Chain</Text>
                    <Text style={styles.detailValue}>{chainLabel}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contract</Text>
                    <Text style={styles.detailValue} selectable>
                      {REWARD_TOKEN_ADDRESS}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
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
    color: '#D33D3D',
  },
  topBarSpacer: {
    width: 44,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#9B5A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  balance: {
    fontSize: 56,
    fontWeight: '700',
    color: '#D33D3D',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  hint: {
    marginTop: 20,
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 22,
    color: '#9B5A5A',
    textAlign: 'center',
  },
  advancedToggle: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B5A5A',
  },
  advanced: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#F5BFA9',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  detailRow: {
    paddingVertical: 14,
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B5A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F5BFA9',
  },
  empty: {
    fontSize: 15,
    color: '#C37A7A',
    textAlign: 'center',
  },
});
