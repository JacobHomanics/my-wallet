import { useCallback } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

import { DepositBankTipsModal } from '@/components/DepositBankTipsModal';
import { BalanceLoadErrorFooter } from '@/components/BalanceLoadErrorFooter';
import { WithdrawUnsupportedModal } from '@/components/WithdrawUnsupportedModal';
import { useDepositBankTipsModal } from '@/hooks/useDepositBankTipsModal';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useOpenFreshSend } from '@/hooks/useOpenFreshSend';
import { useOpenStripeDeposit } from '@/hooks/useOpenStripeDeposit';
import { usePollTokenBalances } from '@/hooks/usePollTokenBalances';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useWithdrawUnsupportedModal } from '@/hooks/useWithdrawUnsupportedModal';
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
    poll,
  } = useTokenBalances();

  usePollTokenBalances(poll, {
    enabled: ready && Boolean(ethereumAddress || solanaAddress),
  });

  const openFreshSend = useOpenFreshSend();
  const { canDeposit, openDeposit } = useOpenStripeDeposit();
  const {
    depositTipsOpen,
    doNotShowAgain,
    setDoNotShowAgain,
    openDepositTips,
    closeDepositTips,
    continueDepositTips,
  } = useDepositBankTipsModal(openDeposit);
  const { withdrawOpen, openWithdraw, closeWithdraw } =
    useWithdrawUnsupportedModal();
  const { formatFromUsd, defaultFormattedZero, currencySymbol } = useFiatDisplay();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const totalLabel = formatFromUsd(totalUsd) ?? defaultFormattedZero;
  const balancePlaceholder = `${currencySymbol}—.——`;
  const hasWallet = Boolean(ethereumAddress || solanaAddress);
  const showActions =
    ready && hasWallet && !(loading && tokens.length === 0);

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
        <View style={styles.hero}>
          {!ready || loading ? (
            <ActivityIndicator color="#166534" />
          ) : !hasWallet ? (
            <Text style={styles.empty}>Creating your wallets…</Text>
          ) : (
            <>
              {error ? (
                <View style={styles.balanceUnavailable}>
                  <Text
                    accessibilityLabel="Balance unavailable"
                    accessibilityRole="header"
                    style={[styles.total, styles.totalUnavailable]}
                  >
                    {balancePlaceholder}
                  </Text>
                  <BalanceLoadErrorFooter
                    onRetry={onRefresh}
                    retrying={refreshing}
                    style={styles.balanceUnavailableFooter}
                  />
                </View>
              ) : (
                <Text style={styles.total} accessibilityRole="header">
                  {totalLabel}
                </Text>
              )}
              {showActions ? (
                <>
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={8}
                    onPress={() => {
                      navigation.navigate('tokenDetails');
                    }}
                    style={({ pressed }) => [
                      pressed && styles.detailsLinkPressed,
                    ]}
                  >
                    <Text style={styles.detailsLinkText}>
                      Show advanced details
                    </Text>
                  </Pressable>
                  <View style={styles.actionsGroup}>
                    <View style={styles.actionsRow}>
                      {canDeposit ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={openDepositTips}
                          style={({ pressed }) => [
                            styles.actionButton,
                            pressed && styles.actionButtonPressed,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="archive-arrow-down-outline"
                            size={18}
                            color="#f8fafc"
                          />
                          <Text style={styles.actionButtonText}>Deposit</Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        onPress={openWithdraw}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        <Ionicons name="business-outline" size={18} color="#f0fdf4" />
                        <Text style={styles.actionButtonText}>Withdraw</Text>
                      </Pressable>
                    </View>
                    <View style={[styles.actionsRow, styles.payReceiveRequestRow]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={openFreshSend}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        <Ionicons name="arrow-up" size={18} color="#f0fdf4" />
                        <Text style={styles.actionButtonText}>Pay</Text>
                      </Pressable>
                    </View>
                    <View style={styles.actionsRow}>
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
                        <Ionicons name="arrow-down" size={18} color="#f0fdf4" />
                        <Text style={styles.actionButtonText}>Receive</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          navigation.navigate('request');
                        }}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        <Ionicons name="cash-outline" size={18} color="#f0fdf4" />
                        <Text style={styles.actionButtonText}>Request</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>
        {showActions ? (
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
        visible={depositTipsOpen}
        doNotShowAgain={doNotShowAgain}
        onDoNotShowAgainChange={setDoNotShowAgain}
        onClose={closeDepositTips}
        onContinue={continueDepositTips}
      />
      <WithdrawUnsupportedModal
        visible={withdrawOpen}
        onClose={closeWithdraw}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: {
    fontSize: 48,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  totalUnavailable: {
    color: '#86a894',
  },
  balanceUnavailable: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  balanceUnavailableFooter: {
    marginTop: 10,
  },
  empty: {
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
  actionsGroup: {
    marginTop: 28,
    alignItems: 'center',
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  payReceiveRequestRow: {
    paddingTop: 64,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#5a7d6a',
    textDecorationLine: 'underline',
  },
});
