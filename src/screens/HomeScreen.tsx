import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  StyleSheet,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { BalanceSkeleton, balanceSkeletonLayout } from '@/components/BalanceSkeleton';

import { DepositBankTipsModal } from '@/components/DepositBankTipsModal';
import { BalanceBreakdownModal } from '@/components/BalanceBreakdownModal';
import { HomeActionButton } from '@/components/HomeActionButton';
import { IconButton } from '@/components/IconButton';
import { PhysicalCardWaitlistCallout } from '@/components/PhysicalCardWaitlistCallout';
import { WithdrawUnsupportedModal } from '@/components/WithdrawUnsupportedModal';
import { useBalanceBreakdownModal } from '@/hooks/useBalanceBreakdownModal';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useHomeActions } from '@/hooks/useHomeActions';
import { usePollTokenBalances } from '@/hooks/usePollTokenBalances';
import { usePrivyEarn } from '@/hooks/usePrivyEarn';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import type { HomeStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export function HomeScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

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

  const { vaultBalanceUsd, loading: earnLoading, refresh: refreshEarn } = usePrivyEarn();

  usePollTokenBalances(poll, {
    enabled: ready && Boolean(ethereumAddress || solanaAddress),
  });

  const { rows: actionRows, depositTips, withdraw } = useHomeActions();
  const { breakdownOpen, openBreakdown, closeBreakdown } =
    useBalanceBreakdownModal();
  const { formatFromUsd, defaultFormattedZero } = useFiatDisplay();

  const onRefresh = useCallback(() => {
    refresh();
    void refreshEarn();
  }, [refresh, refreshEarn]);

  const combinedTotalUsd = useMemo(() => {
    if (totalUsd == null && vaultBalanceUsd === 0) {
      return null;
    }
    return (totalUsd ?? 0) + vaultBalanceUsd;
  }, [totalUsd, vaultBalanceUsd]);

  const totalLabel = formatFromUsd(combinedTotalUsd) ?? defaultFormattedZero;
  const accountBalanceLabel =
    formatFromUsd(totalUsd) ?? defaultFormattedZero;
  const earnBalanceLabel =
    formatFromUsd(vaultBalanceUsd) ?? defaultFormattedZero;
  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const balanceLoading = ready && hasWallet && (loading || earnLoading);
  const showBalanceError =
    ready && hasWallet && !balanceLoading && Boolean(error) && tokens.length === 0;
  const showActions = ready && hasWallet;

  const renderBalance = () => {
    if (balanceLoading) {
      return <BalanceSkeleton />;
    }

    if (!ready) {
      return <View style={styles.balancePlaceholder} />;
    }

    if (!hasWallet) {
      return <Text style={styles.empty}>Creating your wallets…</Text>;
    }

    if (showBalanceError) {
      return (
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
      );
    }

    return (
      <View style={styles.totalRow}>
        <Text style={styles.total} accessibilityRole="header">
          {totalLabel}
        </Text>
        <IconButton
          accessibilityLabel="Balance breakdown"
          color={colors.textMuted}
          icon="help-circle-outline"
          iconSize={22}
          onPress={openBreakdown}
          size={36}
          style={styles.totalHelpButton}
        />
      </View>
    );
  };

  const renderActions = () => {
    if (!showActions || showBalanceError) {
      return null;
    }

    return (
      <>
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => {
            navigation.navigate('tokenDetails');
          }}
          style={({ pressed }) => [pressed && styles.detailsLinkPressed]}
        >
          <Text style={styles.detailsLinkText}>Show advanced details</Text>
        </Pressable>
        <View style={styles.actionsGroup}>
          {actionRows.map((row) => (
            <View key={row.key} style={styles.actionsRow}>
              {row.items.map((action) => (
                <HomeActionButton
                  key={action.key}
                  icon={action.icon}
                  label={action.label}
                  onPress={action.onPress}
                />
              ))}
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#166534"
          />
        }
        style={styles.container}
      >
        <PhysicalCardWaitlistCallout />
        <View style={styles.hero}>
          {renderBalance()}
          {renderActions()}
        </View>
        {showActions && !showBalanceError ? (
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => {
              navigation.navigate('transactions');
            }}
            style={({ pressed }) => [
              styles.transactionsLink,
              pressed && styles.detailsLinkPressed,
            ]}
          >
            <Text style={styles.detailsLinkText}>Transactions</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <DepositBankTipsModal
        visible={depositTips.depositTipsOpen}
        doNotShowAgain={depositTips.doNotShowAgain}
        onDoNotShowAgainChange={depositTips.setDoNotShowAgain}
        onClose={depositTips.closeDepositTips}
        onContinue={depositTips.continueDepositTips}
      />
      <WithdrawUnsupportedModal
        visible={withdraw.withdrawOpen}
        onClose={withdraw.closeWithdraw}
      />
      <BalanceBreakdownModal
        visible={breakdownOpen}
        accountBalanceLabel={accountBalanceLabel}
        earnBalanceLabel={earnBalanceLabel}
        onClose={closeBreakdown}
      />
    </>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  balancePlaceholder: {
    width: balanceSkeletonLayout.width,
    height: balanceSkeletonLayout.height,
  },
  total: {
    fontSize: 48,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  totalHelpButton: {
    marginTop: 4,
  },
  empty: {
    fontSize: 15,
    color: c.textSubtle,
    textAlign: 'center',
  },
  errorBlock: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: c.danger,
    textAlign: 'center',
  },
  errorBanner: {
    marginTop: 12,
    fontSize: 13,
    color: c.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: c.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  actionsGroup: {
    marginTop: 28,
    alignItems: 'center',
    gap: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  detailsLink: {
    marginTop: 20,
    paddingVertical: 4,
  },
  transactionsLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  detailsLinkPressed: {
    opacity: 0.6,
  },
  detailsLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textMuted,
    textDecorationLine: 'underline',
  },
});
}
