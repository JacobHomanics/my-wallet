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

import { TokenIcon } from '@/components/TokenIcon';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { usePollTokenBalances } from '@/hooks/usePollTokenBalances';
import { useRewardTokenBalance } from '@/hooks/useRewardTokenBalance';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getNetworkLabel } from '@/lib/alchemy/networks';
import {
  REWARD_POINTS_LABEL,
  REWARD_TOKEN_ADDRESS,
  REWARD_TOKEN_NETWORK,
  REWARD_TOKEN_SYMBOL,
} from '@/lib/rewardToken';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

/**
 * Shows the user's CashBox Points balance earned from backend payments.
 */
export function RewardsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

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
  const { copy, isCopied } = useCopyToClipboard();

  usePollTokenBalances(poll, {
    enabled: ready && Boolean(ethereumAddress || solanaAddress),
  });

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const loading = !ready || rewardLoading;
  const chainLabel = getNetworkLabel(REWARD_TOKEN_NETWORK);
  const contractCopied = isCopied('reward-contract');

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
              tintColor="#166534"
            />
          }
          style={styles.flex}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : !hasWallet ? (
            <Text style={styles.empty}>Creating your wallets…</Text>
          ) : (
            <View style={styles.main}>
              <Text style={styles.balanceLabel}>{REWARD_POINTS_LABEL}</Text>
              <Text style={styles.balance} accessibilityRole="header">
                {rewardBalance}
              </Text>
              <Text style={styles.hint}>
                Earn {REWARD_POINTS_LABEL} when you send or complete a payment
                with someone else!
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
                  color={colors.textMuted}
                />
              </Pressable>

              {showAdvanced ? (
                <View style={styles.advanced}>
                  <View style={styles.tokenRow}>
                    <TokenIcon
                      logoUrl={null}
                      network={REWARD_TOKEN_NETWORK}
                      size={28}
                      symbol={REWARD_TOKEN_SYMBOL}
                    />
                    <View style={styles.tokenText}>
                      <Text style={styles.tokenSymbol}>
                        {REWARD_POINTS_LABEL}
                      </Text>
                      <Text style={styles.tokenMeta}>{chainLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.field}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>Contract</Text>
                      <Pressable
                        accessibilityLabel={
                          contractCopied
                            ? 'Contract address copied'
                            : 'Copy contract address'
                        }
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => {
                          void copy(REWARD_TOKEN_ADDRESS, 'reward-contract');
                        }}
                        style={({ pressed }) => [
                          styles.copyButton,
                          pressed && styles.copyButtonPressed,
                        ]}
                      >
                        <Ionicons
                          name={contractCopied ? 'checkmark' : 'copy-outline'}
                          size={14}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    </View>
                    <Text style={styles.fieldValue} selectable>
                      {formatWalletAddress(REWARD_TOKEN_ADDRESS, 10, 8)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>
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
  body: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  balanceLabel: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  balance: {
    fontSize: 56,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  hint: {
    marginTop: 20,
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 22,
    color: c.textMuted,
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
    color: c.textMuted,
  },
  advanced: {
    position: 'absolute',
    top: '100%',
    marginTop: 8,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  tokenText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },
  tokenMeta: {
    fontSize: 12,
    color: c.textSubtle,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
  field: {
    paddingVertical: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  copyButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
  fieldValue: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: c.primary,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    fontSize: 15,
    color: c.textSubtle,
    textAlign: 'center',
  },
});
}
