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
import { formatUsdValue } from '@/lib/alchemy/fetchTokensByAddress';
import type { PaymentStrategy } from '@/lib/strategies';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

type SendAdvancedDetailsProps = {
  selectedStrategy: PaymentStrategy;
  onOpenStrategyPicker: () => void;
  allocationInputUnit: AllocationInputUnit;
  onAllocationInputUnitChange: (unit: AllocationInputUnit) => void;
  allocations: PaymentAllocation[];
  allocationInputs: Record<string, string>;
  onAllocationAmountChange: (tokenId: string, value: string) => void;
  onRemoveAllocation: (tokenId: string) => void;
  canAddToken: boolean;
  onAddToken: () => void;
};

export function SendAdvancedDetails({
  selectedStrategy,
  onOpenStrategyPicker,
  allocationInputUnit,
  onAllocationInputUnitChange,
  allocations,
  allocationInputs,
  onAllocationAmountChange,
  onRemoveAllocation,
  canAddToken,
  onAddToken,
}: SendAdvancedDetailsProps) {
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
        <Ionicons name="chevron-down" size={18} color="#94a3b8" />
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
            accessibilityLabel="Edit amounts in USD"
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
              USD
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
          const inputValue =
            allocationInputs[leg.token.id] ??
            (allocationInputUnit === 'usd'
              ? String(leg.usd)
              : leg.amountFormatted);
          const exceeds = leg.amountRaw > leg.token.rawBalance;
          const secondaryValue =
            allocationInputUnit === 'usd'
              ? leg.amountFormatted || '—'
              : (formatUsdValue(leg.usd) ?? '—');

          return (
            <View key={leg.token.id} style={styles.allocationRow}>
              <View style={styles.allocationHeader}>
                <TokenIcon
                  logoUrl={leg.token.logoUrl}
                  network={leg.token.network}
                  size={32}
                  symbol={leg.token.symbol}
                />
                <View style={styles.allocationText}>
                  <View style={styles.allocationTitleRow}>
                    <Text style={styles.allocationSymbol} numberOfLines={1}>
                      {leg.token.symbol}
                    </Text>
                    <Text style={styles.allocationBalance} numberOfLines={1}>
                      Balance:{' '}
                      {allocationInputUnit === 'usd'
                        ? (formatUsdValue(leg.token.usdValue) ?? '—')
                        : leg.token.balanceFormatted}
                    </Text>
                  </View>
                  <Text style={styles.allocationMeta} numberOfLines={1}>
                    {leg.token.networkLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.allocationControls}>
                {allocationInputUnit === 'usd' ? (
                  <Text style={styles.allocationInputPrefix}>$</Text>
                ) : null}
                <TextInput
                  accessibilityLabel={
                    allocationInputUnit === 'usd'
                      ? `${leg.token.symbol} USD amount`
                      : `${leg.token.symbol} amount`
                  }
                  keyboardType="decimal-pad"
                  onChangeText={(value) => {
                    onAllocationAmountChange(leg.token.id, value);
                  }}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
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
          <Ionicons name="add" size={18} color="#0f172a" />
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
    borderColor: '#e2e8f0',
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
    color: '#64748b',
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
    backgroundColor: '#f1f5f9',
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
    color: '#64748b',
  },
  unitToggleTextActive: {
    color: '#0f172a',
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
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
    color: '#64748b',
    marginRight: 12,
  },
  strategyRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  allocationEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    paddingVertical: 10,
  },
  allocationRow: {
    paddingVertical: 10,
    gap: 8,
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
    color: '#0f172a',
  },
  allocationMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#94a3b8',
  },
  allocationBalance: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
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
    color: '#0f172a',
  },
  allocationInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
    backgroundColor: '#f8fafc',
    fontVariant: ['tabular-nums'],
  },
  allocationInputError: {
    borderColor: '#fca5a5',
  },
  allocationSecondary: {
    minWidth: 64,
    maxWidth: 96,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
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
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  addTokenButtonPressed: {
    opacity: 0.7,
  },
  addTokenButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});
