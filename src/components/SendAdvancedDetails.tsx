import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FrontendSendRewardsWarningModal } from '@/components/FrontendSendRewardsWarningModal';
import { TokenIcon } from '@/components/TokenIcon';
import type { AllocationInputUnit } from '@/hooks/useAllocationInputUnit';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  formatRawTokenBalance,
  isUnpricedToken,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { floorUsdToSendableCap, formatFiatValue } from '@/lib/fiat';
import type { SendBroadcastMode } from '@/lib/send/broadcastMode';
import type { TaxFundingPick } from '@/lib/send/buildPaymentLegsWithTax';
import type { GasFundingPick } from '@/lib/send/gasReserves';
import { REWARD_POINTS_LABEL } from '@/lib/rewardToken';
import type { PaymentStrategy } from '@/lib/strategies';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

type SendAdvancedDetailsProps = {
  selectedStrategy: PaymentStrategy;
  onOpenStrategyPicker: () => void;
  allocationInputUnit: AllocationInputUnit;
  onAllocationInputUnitChange: (unit: AllocationInputUnit) => void;
  broadcastMode: SendBroadcastMode;
  onBroadcastModeChange: (mode: SendBroadcastMode) => void;
  gasSponsorship: boolean;
  onGasSponsorshipChange: (enabled: boolean) => void;
  allocations: PaymentAllocation[];
  /** Fee-reserved balances — used for the Available line on each leg. */
  spendableTokens: OwnedToken[];
  /** Single-token tax funding pick; reserved from Available on that token. */
  taxFunding?: TaxFundingPick | null;
  /** Native gas reserved on gas tokens for network fees. */
  gasFunding?: GasFundingPick[];
  allocationInputs: Record<string, string>;
  onAllocationAmountChange: (tokenId: string, value: string) => void;
  onRemoveAllocation: (tokenId: string) => void;
  canAddToken: boolean;
  onAddToken: () => void;
};

function merchantAvailableToken(
  spendable: OwnedToken,
  taxFunding: TaxFundingPick | null | undefined,
): OwnedToken {
  if (
    taxFunding == null ||
    taxFunding.token.id !== spendable.id ||
    taxFunding.amountRaw <= 0n
  ) {
    return spendable;
  }

  const merchantRaw =
    spendable.rawBalance > taxFunding.amountRaw
      ? spendable.rawBalance - taxFunding.amountRaw
      : 0n;

  if (merchantRaw === spendable.rawBalance) {
    return spendable;
  }

  const usdScale =
    spendable.usdValue != null && spendable.rawBalance > 0n
      ? Number(merchantRaw) / Number(spendable.rawBalance)
      : 1;

  return {
    ...spendable,
    rawBalance: merchantRaw,
    balanceFormatted: formatRawTokenBalance(merchantRaw, spendable.decimals),
    usdValue:
      spendable.usdValue != null
        ? Math.max(0, spendable.usdValue * usdScale)
        : spendable.usdValue,
  };
}

type ReservedAllocationRowProps = {
  token: OwnedToken;
  badgeLabel: string;
  amountFormatted: string;
  usd: number;
  allocationInputUnit: AllocationInputUnit;
  formatAmountInputFromUsd: (usd: number) => string;
  formatFromUsd: (usd: number | null) => string | null;
  currencySymbol: string;
};

function ReservedAllocationRow({
  token,
  badgeLabel,
  amountFormatted,
  usd,
  allocationInputUnit,
  formatAmountInputFromUsd,
  formatFromUsd,
  currencySymbol,
}: ReservedAllocationRowProps) {
  return (
    <View style={[styles.allocationRow, styles.taxAllocationRow]}>
      <View style={styles.allocationHeader}>
        <TokenIcon
          logoUrl={token.logoUrl}
          network={token.network}
          size={32}
          symbol={token.symbol}
        />
        <View style={styles.allocationText}>
          <View style={styles.allocationTitleRow}>
            <Text style={styles.allocationSymbol} numberOfLines={1}>
              {token.symbol}
            </Text>
            <Text style={styles.taxBadge}>{badgeLabel}</Text>
          </View>
          <Text style={styles.allocationMeta} numberOfLines={1}>
            {token.networkLabel}
          </Text>
        </View>
      </View>
      <View style={styles.allocationControls}>
        {allocationInputUnit === 'usd' ? (
          <Text style={styles.allocationInputPrefix}>{currencySymbol}</Text>
        ) : null}
        <View style={styles.taxAmountBox}>
          <Text style={styles.taxAmountText}>
            {allocationInputUnit === 'usd'
              ? formatAmountInputFromUsd(usd)
              : amountFormatted}
          </Text>
        </View>
        <Text style={styles.allocationSecondary} numberOfLines={1}>
          {allocationInputUnit === 'usd'
            ? amountFormatted
            : (formatFromUsd(usd) ?? '—')}
        </Text>
        <View style={styles.allocationRemove} />
      </View>
    </View>
  );
}

export function SendAdvancedDetails({
  selectedStrategy,
  onOpenStrategyPicker,
  allocationInputUnit,
  onAllocationInputUnitChange,
  broadcastMode,
  onBroadcastModeChange,
  gasSponsorship,
  onGasSponsorshipChange,
  allocations,
  spendableTokens,
  taxFunding = null,
  gasFunding = [],
  allocationInputs,
  onAllocationAmountChange,
  onRemoveAllocation,
  canAddToken,
  onAddToken,
}: SendAdvancedDetailsProps) {
  const {
    formatFromUsd,
    formatAmountInputFromUsd,
    currencyCode,
    currencySymbol,
    rate,
    defaultFormattedZero,
  } = useFiatDisplay();
  const [frontendWarningOpen, setFrontendWarningOpen] = useState(false);

  const spendableById = new Map(
    spendableTokens.map((token) => [token.id, token]),
  );

  const frontendSendEnabled = broadcastMode === 'frontend';

  const onFrontendSendChange = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        onBroadcastModeChange('backend');
        return;
      }
      if (broadcastMode === 'frontend') {
        return;
      }
      setFrontendWarningOpen(true);
    },
    [broadcastMode, onBroadcastModeChange],
  );

  const onCancelFrontendWarning = useCallback(() => {
    setFrontendWarningOpen(false);
  }, []);

  const onConfirmFrontendWarning = useCallback(() => {
    setFrontendWarningOpen(false);
    onBroadcastModeChange('frontend');
  }, [onBroadcastModeChange]);

  return (
    <View style={styles.advanced}>
      <Pressable
        accessibilityLabel={`Payment strategy ${selectedStrategy.label}`}
        accessibilityRole="button"
        onPress={onOpenStrategyPicker}
        style={({ pressed }) => [
          styles.strategyRow,
          pressed && styles.strategyRowPressed,
        ]}
      >
        <Text style={styles.strategyRowLabel}>Strategy</Text>
        <Text style={styles.strategyRowValue} numberOfLines={1}>
          {selectedStrategy.label}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#86a894" />
      </Pressable>

      <View style={styles.advancedDivider} />

      <View style={styles.broadcastRow}>
        <View style={styles.broadcastText}>
          <Text style={styles.broadcastLabel}>Send from this device</Text>
          <Text style={styles.broadcastHint}>
            Skips backend broadcast and {REWARD_POINTS_LABEL}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Send from this device"
          trackColor={{ false: '#bbf7d0', true: '#86efac' }}
          thumbColor={frontendSendEnabled ? '#166534' : '#f0fdf4'}
          ios_backgroundColor="#bbf7d0"
          value={frontendSendEnabled}
          onValueChange={onFrontendSendChange}
        />
      </View>

      <View style={styles.advancedDivider} />

      <View style={styles.broadcastRow}>
        <View style={styles.broadcastText}>
          <Text style={styles.broadcastLabel}>Gas sponsorship where available</Text>
          <Text style={styles.broadcastHint}>
            {gasSponsorship
              ? 'App pays fees on supported chains'
              : 'You pay network fees from your wallet'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Gas sponsorship where available"
          trackColor={{ false: '#bbf7d0', true: '#86efac' }}
          thumbColor={gasSponsorship ? '#166534' : '#f0fdf4'}
          ios_backgroundColor="#bbf7d0"
          value={gasSponsorship}
          onValueChange={onGasSponsorshipChange}
        />
      </View>

      <View style={styles.advancedDivider} />

      <View style={styles.tokensHeader}>
        <Text style={[styles.advancedLabel, styles.tokensHeaderLabel]}>
          Tokens
        </Text>
        <View style={styles.unitToggle}>
          <Pressable
            accessibilityLabel="Edit amounts in tokens"
            accessibilityRole="button"
            accessibilityState={{
              selected: allocationInputUnit === 'token',
            }}
            onPress={() => {
              onAllocationInputUnitChange('token');
            }}
            style={({ pressed }) => [
              styles.unitToggleOption,
              allocationInputUnit === 'token' && styles.unitToggleOptionActive,
              pressed && styles.unitToggleOptionPressed,
            ]}
          >
            <Text
              style={[
                styles.unitToggleText,
                allocationInputUnit === 'token' && styles.unitToggleTextActive,
              ]}
            >
              Token
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Edit amounts in ${currencyCode}`}
            accessibilityRole="button"
            accessibilityState={{
              selected: allocationInputUnit === 'usd',
            }}
            onPress={() => {
              onAllocationInputUnitChange('usd');
            }}
            style={({ pressed }) => [
              styles.unitToggleOption,
              allocationInputUnit === 'usd' && styles.unitToggleOptionActive,
              pressed && styles.unitToggleOptionPressed,
            ]}
          >
            <Text
              style={[
                styles.unitToggleText,
                allocationInputUnit === 'usd' && styles.unitToggleTextActive,
              ]}
            >
              {currencyCode}
            </Text>
          </Pressable>
        </View>
      </View>

      <FrontendSendRewardsWarningModal
        visible={frontendWarningOpen}
        onCancel={onCancelFrontendWarning}
        onConfirm={onConfirmFrontendWarning}
      />

      {allocations.length === 0 ? (
        <Text style={styles.allocationEmpty}>
          Add a token below to get started.
        </Text>
      ) : (
        allocations.map((leg) => {
          const spendable = spendableById.get(leg.token.id) ?? leg.token;
          const unpriced = isUnpricedToken(spendable);
          const availableToken = merchantAvailableToken(spendable, taxFunding);
          const taxRawOnLeg =
            taxFunding != null && taxFunding.token.id === leg.token.id
              ? taxFunding.amountRaw
              : 0n;
          const inputValue =
            allocationInputs[leg.token.id] ??
            (allocationInputUnit === 'usd' && !unpriced
              ? leg.usd > 0
                ? String(leg.usd)
                : leg.amountFormatted
              : leg.amountFormatted);
          const exceeds = leg.amountRaw + taxRawOnLeg > spendable.rawBalance;
          const secondaryValue = unpriced
            ? null
            : allocationInputUnit === 'usd'
              ? leg.amountFormatted || '—'
              : (formatFromUsd(leg.usd) ?? '—');

          const availableLabel =
            allocationInputUnit === 'usd' && !unpriced
              ? (() => {
                  if (availableToken.usdValue == null) {
                    return '—';
                  }
                  if (!(availableToken.usdValue > 0)) {
                    return defaultFormattedZero;
                  }
                  const { displayFiat } = floorUsdToSendableCap(
                    availableToken.usdValue,
                    rate,
                    currencyCode,
                  );
                  return (
                    formatFiatValue(displayFiat, currencyCode) ??
                    defaultFormattedZero
                  );
                })()
              : availableToken.balanceFormatted;

          return (
            <View key={leg.token.id} style={styles.allocationRow}>
              <View style={styles.allocationHeader}>
                <TokenIcon
                  logoUrl={spendable.logoUrl}
                  network={spendable.network}
                  size={32}
                  symbol={spendable.symbol}
                />
                <View style={styles.allocationText}>
                  <View style={styles.allocationTitleRow}>
                    <Text style={styles.allocationSymbol} numberOfLines={1}>
                      {spendable.symbol}
                    </Text>
                    <Text style={styles.allocationBalance} numberOfLines={1}>
                      Available: {availableLabel}
                    </Text>
                  </View>
                  <Text style={styles.allocationMeta} numberOfLines={1}>
                    {spendable.networkLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.allocationControls}>
                {allocationInputUnit === 'usd' && !unpriced ? (
                  <Text style={styles.allocationInputPrefix}>
                    {currencySymbol}
                  </Text>
                ) : null}
                <TextInput
                  accessibilityLabel={
                    allocationInputUnit === 'usd' && !unpriced
                      ? `${leg.token.symbol} ${currencyCode} amount`
                      : `${leg.token.symbol} amount`
                  }
                  keyboardType="decimal-pad"
                  onChangeText={(value) => {
                    onAllocationAmountChange(leg.token.id, value);
                  }}
                  placeholder="0"
                  placeholderTextColor="#86a894"
                  style={[
                    styles.allocationInput,
                    exceeds ? styles.allocationInputError : null,
                  ]}
                  value={inputValue}
                />
                {secondaryValue != null ? (
                  <Text style={styles.allocationSecondary} numberOfLines={1}>
                    {secondaryValue}
                  </Text>
                ) : (
                  <View style={styles.allocationSecondary} />
                )}
                <Pressable
                  accessibilityLabel={`Remove ${leg.token.symbol}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    onRemoveAllocation(leg.token.id);
                  }}
                  style={({ pressed }) => [
                    styles.allocationRemove,
                    pressed && styles.allocationRemovePressed,
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      {gasFunding.map((pick) => (
        <ReservedAllocationRow
          key={pick.token.id}
          allocationInputUnit={allocationInputUnit}
          amountFormatted={pick.amountFormatted}
          badgeLabel="Gas"
          currencySymbol={currencySymbol}
          formatAmountInputFromUsd={formatAmountInputFromUsd}
          formatFromUsd={formatFromUsd}
          token={pick.token}
          usd={pick.usd}
        />
      ))}

      {taxFunding != null && taxFunding.amountRaw > 0n ? (
        <ReservedAllocationRow
          allocationInputUnit={allocationInputUnit}
          amountFormatted={taxFunding.amountFormatted}
          badgeLabel="Service fee"
          currencySymbol={currencySymbol}
          formatAmountInputFromUsd={formatAmountInputFromUsd}
          formatFromUsd={formatFromUsd}
          token={taxFunding.token}
          usd={taxFunding.usd}
        />
      ) : null}

      {canAddToken ? (
        <Pressable
          accessibilityLabel="Add token"
          accessibilityRole="button"
          onPress={onAddToken}
          style={({ pressed }) => [
            styles.addTokenButton,
            pressed && styles.addTokenButtonPressed,
          ]}
        >
          <Ionicons name="add" size={18} color="#166534" />
          <Text style={styles.addTokenButtonText}>Add token</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  advanced: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  advancedLabel: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tokensHeader: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tokensHeaderLabel: {
    marginTop: 0,
    marginBottom: 0,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 2,
  },
  unitToggleOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unitToggleOptionActive: {
    backgroundColor: '#fff',
  },
  unitToggleOptionPressed: {
    opacity: 0.7,
  },
  unitToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a7d6a',
  },
  unitToggleTextActive: {
    color: '#166534',
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  broadcastText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  broadcastLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  broadcastHint: {
    fontSize: 12,
    lineHeight: 16,
    color: '#86a894',
  },
  strategyRowPressed: {
    opacity: 0.7,
  },
  strategyRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    marginRight: 12,
  },
  strategyRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginRight: 8,
  },
  allocationEmpty: {
    fontSize: 14,
    color: '#86a894',
    paddingVertical: 10,
  },
  allocationRow: {
    paddingVertical: 10,
    gap: 8,
  },
  taxAllocationRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d1fae5',
    marginTop: 4,
    paddingTop: 12,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allocationText: {
    flex: 1,
    minWidth: 0,
  },
  allocationTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    minWidth: 0,
  },
  allocationSymbol: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  taxBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  allocationMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#86a894',
  },
  allocationBalance: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
  },
  allocationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allocationInputPrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  allocationInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'right',
    backgroundColor: '#f0fdf4',
    fontVariant: ['tabular-nums'],
  },
  allocationInputError: {
    borderColor: '#fca5a5',
  },
  taxAmountBox: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
  },
  taxAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5a7d6a',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  allocationSecondary: {
    minWidth: 64,
    maxWidth: 96,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    fontVariant: ['tabular-nums'],
  },
  allocationRemove: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationRemovePressed: {
    opacity: 0.6,
  },
  addTokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#86d4a4',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
  },
  addTokenButtonPressed: {
    opacity: 0.7,
  },
  addTokenButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
});
