import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TokenIcon } from '@/components/TokenIcon';
import type { AllocationInputUnit } from '@/hooks/useAllocationInputUnit';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  formatRawTokenBalance,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { floorUsdToSendableCap, formatFiatValue } from '@/lib/fiat';
import type { TaxFundingPick } from '@/lib/send/buildPaymentLegsWithTax';
import type { PaymentStrategy } from '@/lib/strategies';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

type SendAdvancedDetailsProps = {
  selectedStrategy: PaymentStrategy;
  onOpenStrategyPicker: () => void;
  allocationInputUnit: AllocationInputUnit;
  onAllocationInputUnitChange: (unit: AllocationInputUnit) => void;
  allocations: PaymentAllocation[];
  /** Fee-reserved balances — used for the Available line on each leg. */
  spendableTokens: OwnedToken[];
  /** Single-token tax funding pick; reserved from Available on that token. */
  taxFunding?: TaxFundingPick | null;
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

export function SendAdvancedDetails({
  selectedStrategy,
  onOpenStrategyPicker,
  allocationInputUnit,
  onAllocationInputUnitChange,
  allocations,
  spendableTokens,
  taxFunding = null,
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

  const spendableById = new Map(
    spendableTokens.map((token) => [token.id, token]),
  );

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

      {allocations.length === 0 ? (
        <Text style={styles.allocationEmpty}>
          Enter an amount or add a token to get started.
        </Text>
      ) : (
        allocations.map((leg) => {
          const spendable = spendableById.get(leg.token.id) ?? leg.token;
          const availableToken = merchantAvailableToken(spendable, taxFunding);
          const taxRawOnLeg =
            taxFunding != null && taxFunding.token.id === leg.token.id
              ? taxFunding.amountRaw
              : 0n;
          const inputValue =
            allocationInputs[leg.token.id] ??
            (allocationInputUnit === 'usd'
              ? String(leg.usd)
              : leg.amountFormatted);
          const exceeds = leg.amountRaw + taxRawOnLeg > spendable.rawBalance;
          const secondaryValue =
            allocationInputUnit === 'usd'
              ? leg.amountFormatted || '—'
              : (formatFromUsd(leg.usd) ?? '—');

          const availableLabel =
            allocationInputUnit === 'usd'
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
                {allocationInputUnit === 'usd' ? (
                  <Text style={styles.allocationInputPrefix}>
                    {currencySymbol}
                  </Text>
                ) : null}
                <TextInput
                  accessibilityLabel={
                    allocationInputUnit === 'usd'
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
                <Text style={styles.allocationSecondary} numberOfLines={1}>
                  {secondaryValue}
                </Text>
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

      {taxFunding != null && taxFunding.amountRaw > 0n ? (
        <View style={[styles.allocationRow, styles.taxAllocationRow]}>
          <View style={styles.allocationHeader}>
            <TokenIcon
              logoUrl={taxFunding.token.logoUrl}
              network={taxFunding.token.network}
              size={32}
              symbol={taxFunding.token.symbol}
            />
            <View style={styles.allocationText}>
              <View style={styles.allocationTitleRow}>
                <Text style={styles.allocationSymbol} numberOfLines={1}>
                  {taxFunding.token.symbol}
                </Text>
                <Text style={styles.taxBadge}>Service fee</Text>
              </View>
              <Text style={styles.allocationMeta} numberOfLines={1}>
                {taxFunding.token.networkLabel}
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
                  ? formatAmountInputFromUsd(taxFunding.usd)
                  : taxFunding.amountFormatted}
              </Text>
            </View>
            <Text style={styles.allocationSecondary} numberOfLines={1}>
              {allocationInputUnit === 'usd'
                ? taxFunding.amountFormatted
                : (formatFromUsd(taxFunding.usd) ?? '—')}
            </Text>
            <View style={styles.allocationRemove} />
          </View>
        </View>
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
