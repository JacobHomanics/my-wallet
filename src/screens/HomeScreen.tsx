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

import { DepositMethodPickerModal } from '@/components/DepositMethodPickerModal';
import { useDepositMethodPicker } from '@/hooks/useDepositMethodPicker';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useFiatOnrampDeposit } from '@/hooks/useFiatOnrampDeposit';
import { useOpenFreshSend } from '@/hooks/useOpenFreshSend';
import { usePollTokenBalances } from '@/hooks/usePollTokenBalances';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import type { DepositMethodOption } from '@/lib/privy/onramp';
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
  const {
    isAvailable: canDeposit,
    isLoading: depositLoading,
    error: depositError,
    deposit,
  } = useFiatOnrampDeposit();
  const {
    methods: depositMethods,
    pickerOpen: depositPickerOpen,
    openPicker: openDepositPicker,
    closePicker: closeDepositPicker,
  } = useDepositMethodPicker();
  const { formatFromUsd, defaultFormattedZero } = useFiatDisplay();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const onSelectDepositMethod = useCallback(
    async (option: DepositMethodOption) => {
      closeDepositPicker();
      const status = await deposit(option.id);
      if (status === 'confirmed' || status === 'submitted') {
        refresh();
      }
    },
    [closeDepositPicker, deposit, refresh],
  );

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
            {depositError ? (
              <Text style={styles.errorBanner}>{depositError}</Text>
            ) : null}
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
                    <Ionicons name="arrow-up" size={18} color="#f0fdf4" />
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
                    <Ionicons name="arrow-down" size={18} color="#f0fdf4" />
                    <Text style={styles.actionButtonText}>Receive</Text>
                  </Pressable>
                  {canDeposit ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={depositLoading}
                      onPress={openDepositPicker}
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                        depositLoading && styles.actionButtonDisabled,
                      ]}
                    >
                      {depositLoading ? (
                        <ActivityIndicator color="#f8fafc" size="small" />
                      ) : (
                        <MaterialCommunityIcons
                          name="archive-arrow-down-outline"
                          size={18}
                          color="#f8fafc"
                        />
                      )}
                      <Text style={styles.actionButtonText}>
                        {depositLoading ? 'Deposit…' : 'Deposit'}
                      </Text>
                    </Pressable>
                  ) : null}
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

      {canDeposit ? (
        <DepositMethodPickerModal
          disabled={depositLoading}
          methods={depositMethods}
          onClose={closeDepositPicker}
          onSelect={onSelectDepositMethod}
          visible={depositPickerOpen}
        />
      ) : null}
    </ScrollView>
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
    flexGrow: 1,
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
  empty: {
    fontSize: 15,
    color: '#86a894',
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
  actionsRow: {
    marginTop: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonDisabled: {
    opacity: 0.6,
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
  detailsLinkPressed: {
    opacity: 0.6,
  },
  detailsLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5a7d6a',
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
