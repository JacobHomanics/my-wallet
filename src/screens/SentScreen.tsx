import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { TokenIcon } from '@/components/TokenIcon';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import { getNetworkLabel } from '@/lib/alchemy/networks';
import {
  REWARD_POINTS_LABEL,
  REWARD_TOKEN_NETWORK,
  REWARD_TOKEN_SYMBOL,
} from '@/lib/rewardToken';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Shown after a successful multi-token payment from the confirm screen.
 */
export function SentScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sent'>>();
  const {
    usdLabel,
    legs,
    rewardAmount,
    rewardHash,
    rewardFailed,
    recipientLabel,
    recipientProfilePhotoUrl,
    recipientUsername,
    recipientIsFarcaster,
  } = route.params;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const onDone = useCallback(() => {
    navigation.navigate('index');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topBarTitle}>Sent</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} style={styles.flex}>
          <View style={styles.resultIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#15803d" />
          </View>
          <Text style={styles.resultTitle}>Sent</Text>
          <Text style={styles.heroUsd}>{usdLabel}</Text>

          {recipientLabel ? (
            <View style={styles.recipientSection}>
              <Text style={styles.recipientLabel}>To</Text>
              <View style={styles.recipientRow}>
                <Avatar
                  label={recipientLabel}
                  photoUrl={recipientProfilePhotoUrl}
                  seed={recipientUsername ?? recipientLabel}
                  size={40}
                  showFarcasterBadge={recipientIsFarcaster}
                />
                <Text
                  style={styles.recipientValue}
                  selectable
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {recipientLabel}
                </Text>
              </View>
            </View>
          ) : null}

          {rewardAmount ? (
            <View style={styles.rewardSection}>
              <Text style={styles.rewardLabel}>Rewards</Text>
              <Text style={styles.rewardValue}>
                {rewardAmount} {REWARD_POINTS_LABEL}
              </Text>
            </View>
          ) : rewardFailed ? (
            <View style={styles.rewardSection}>
              <Text style={styles.rewardFailedText}>
                {
                  "Your money was sent! However, we weren't able to reward you with "
                }
                {REWARD_POINTS_LABEL}. Sorry!
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showAdvanced }}
            onPress={() => {
              setShowAdvanced((open) => !open);
            }}
            style={({ pressed }) => [
              styles.advancedToggle,
              pressed && styles.advancedTogglePressed,
            ]}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
            </Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#5a7d6a"
            />
          </Pressable>

          {showAdvanced ? (
            <View style={styles.advanced}>
              {legs.map((leg, index) => (
                <View key={`${leg.hash}-${leg.symbol}`}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.tokenRow}>
                    <TokenIcon
                      logoUrl={leg.logoUrl}
                      network={leg.network}
                      size={36}
                      symbol={leg.symbol}
                    />
                    <View style={styles.tokenText}>
                      <Text style={styles.tokenSymbol}>
                        {leg.amount} {leg.symbol}
                        {leg.isTax ? ' (service fee)' : ''}
                      </Text>
                      <Text style={styles.tokenMeta}>{leg.networkLabel}</Text>
                    </View>
                  </View>
                  <SummaryRow
                    label="Transaction"
                    value={formatWalletAddress(leg.hash, 10, 10)}
                    mono
                  />
                </View>
              ))}
              {rewardAmount && rewardHash ? (
                <View key={`reward-${rewardHash}`}>
                  {legs.length > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.tokenRow}>
                    <TokenIcon
                      logoUrl={null}
                      network={REWARD_TOKEN_NETWORK}
                      size={36}
                      symbol={REWARD_TOKEN_SYMBOL}
                    />
                    <View style={styles.tokenText}>
                      <Text style={styles.tokenSymbol}>
                        {rewardAmount} {REWARD_POINTS_LABEL} (reward)
                      </Text>
                      <Text style={styles.tokenMeta}>
                        {getNetworkLabel(REWARD_TOKEN_NETWORK)}
                      </Text>
                    </View>
                  </View>
                  <SummaryRow
                    label="Transaction"
                    value={formatWalletAddress(rewardHash, 10, 10)}
                    mono
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onDone}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[styles.summaryValue, mono && styles.summaryMono]}
        numberOfLines={2}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    color: '#166534',
  },
  topBarSpacer: {
    width: 44,
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 28,
    alignItems: 'center',
  },
  resultIcon: {
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  heroUsd: {
    fontSize: 36,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: -0.6,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  recipientSection: {
    marginTop: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  recipientLabel: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    maxWidth: '100%',
  },
  recipientValue: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  rewardSection: {
    marginTop: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  rewardLabel: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#15803d',
    fontVariant: ['tabular-nums'],
  },
  rewardFailedText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: '#a16207',
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
    color: '#5a7d6a',
  },
  advanced: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  tokenText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  tokenMeta: {
    fontSize: 13,
    color: '#86a894',
  },
  summaryRow: {
    paddingBottom: 14,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  summaryMono: {
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
  primaryButton: {
    marginTop: 28,
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
});
