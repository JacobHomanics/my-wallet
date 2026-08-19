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
import { useSendVaultUsdc } from '@/hooks/useSendVaultUsdc';
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
import { isGasSponsorshipAvailable } from '@/hooks/useGasSponsorship';
import {
  formatVaultUsdcFundingSplit,
  getVaultUsdcTaxFundingKey,
  type VaultUsdcFundingSplit,
} from '@/lib/privy/vaultUsdc';
import type { PaymentStrategy } from '@/lib/strategies';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export type SendConfigurationFieldsProps = {
  broadcastMode: SendBroadcastMode;
  onBroadcastModeChange: (mode: SendBroadcastMode) => void;
  gasSponsorship: boolean;
  onGasSponsorshipChange: (enabled: boolean) => void;
};

export type SendTokenAllocationsProps = {
  selectedStrategy: PaymentStrategy;
  onOpenStrategyPicker: () => void;
  allocationInputUnit: AllocationInputUnit;
  onAllocationInputUnitChange: (unit: AllocationInputUnit) => void;
  allocations: PaymentAllocation[];
  /** Fee-reserved balances — used for the Available line on each leg. */
  spendableTokens: OwnedToken[];
  /** Single-token tax funding pick; reserved from Available on that token. */
  taxFunding?: TaxFundingPick | null;
  /** Gas reserved on fee-paying tokens for network fees. */
  gasFunding?: GasFundingPick[];
  /** Vault vs wallet USDC split per allocation / tax leg. */
  vaultUsdcFundingSplits?: ReadonlyMap<string, VaultUsdcFundingSplit>;
  allocationInputs: Record<string, string>;
  onAllocationAmountChange: (tokenId: string, value: string) => void;
  onRemoveAllocation: (tokenId: string) => void;
  canAddToken: boolean;
  onAddToken: () => void;
};

export type SendAdvancedDetailsProps = SendConfigurationFieldsProps &
  SendTokenAllocationsProps;

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
  vaultFundingSplit?: VaultUsdcFundingSplit;
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
  vaultFundingSplit,
}: ReservedAllocationRowProps) {
  const styles = useThemedStyles(createStyles);

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
          {vaultFundingSplit != null ? (
            <Text style={styles.fundingSplit} numberOfLines={2}>
              {formatVaultUsdcFundingSplit(vaultFundingSplit, token)}
            </Text>
          ) : null}
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

export function SendConfigurationFields({
  broadcastMode,
  onBroadcastModeChange,
  gasSponsorship,
  onGasSponsorshipChange,
}: SendConfigurationFieldsProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const [frontendWarningOpen, setFrontendWarningOpen] = useState(false);
  const {
    globallyEnabled: vaultGloballyEnabled,
    perSendEnabled: useVaultUsdc,
    setPerSendEnabled: setUseVaultUsdc,
    globalLoading: vaultSettingsLoading,
  } = useSendVaultUsdc();
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
    onGasSponsorshipChange(false);
    onBroadcastModeChange('frontend');
  }, [onBroadcastModeChange, onGasSponsorshipChange]);

  const cashboxNetworkEnabled = broadcastMode === 'backend';
  const showGasSponsorshipToggle = isGasSponsorshipAvailable() && cashboxNetworkEnabled;

  return (
    <>
      <View style={styles.broadcastRow}>
        <View style={styles.broadcastText}>
          <Text style={styles.broadcastLabel}>Use vault balance</Text>
          <Text style={styles.broadcastHint}>
            {vaultGloballyEnabled
              ? 'When you make an eligible payment, automatically move money from your vault into your balance'
              : 'Turn on in Settings → Earn settings to use your vault for eligible payments'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Use vault balance for this payment"
          disabled={!vaultGloballyEnabled || vaultSettingsLoading}
          trackColor={{ false: colors.border, true: colors.borderStrong }}
          thumbColor={
            useVaultUsdc && vaultGloballyEnabled ? colors.primary : colors.bg
          }
          ios_backgroundColor={colors.border}
          value={vaultGloballyEnabled && useVaultUsdc}
          onValueChange={setUseVaultUsdc}
        />
      </View>

      <View style={styles.advancedDivider} />

      <View style={styles.broadcastRow}>
        <View style={styles.broadcastText}>
          <Text style={styles.broadcastLabel}>Send from this device</Text>
          <Text style={styles.broadcastHint}>
            Skips backend broadcast, {REWARD_POINTS_LABEL}
            {isGasSponsorshipAvailable() ? ', and gas sponsorship' : ''}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Send from this device"
          trackColor={{ false: colors.border, true: colors.borderStrong }}
          thumbColor={frontendSendEnabled ? colors.primary : colors.bg}
          ios_backgroundColor={colors.border}
          value={frontendSendEnabled}
          onValueChange={onFrontendSendChange}
        />
      </View>

      {showGasSponsorshipToggle ? (
        <>
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
              trackColor={{ false: colors.border, true: colors.borderStrong }}
              thumbColor={gasSponsorship ? colors.primary : colors.bg}
              ios_backgroundColor={colors.border}
              value={gasSponsorship}
              onValueChange={onGasSponsorshipChange}
            />
          </View>
        </>
      ) : null}

      <FrontendSendRewardsWarningModal
        visible={frontendWarningOpen}
        onCancel={onCancelFrontendWarning}
        onConfirm={onConfirmFrontendWarning}
      />
    </>
  );
}

export function SendTokenAllocations({
  selectedStrategy,
  onOpenStrategyPicker,
  allocationInputUnit,
  onAllocationInputUnitChange,
  allocations,
  spendableTokens,
  taxFunding = null,
  gasFunding = [],
  vaultUsdcFundingSplits,
  allocationInputs,
  onAllocationAmountChange,
  onRemoveAllocation,
  canAddToken,
  onAddToken,
}: SendTokenAllocationsProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

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
    <>
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
        <Ionicons name="chevron-down" size={18} color={colors.textSubtle} />
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
          Add a token below to get started.
        </Text>
      ) : (
        allocations.map((leg) => {
          const spendable = spendableById.get(leg.token.id) ?? leg.token;
          const unpriced = isUnpricedToken(spendable);
          const availableToken = merchantAvailableToken(spendable, taxFunding);
          const inputValue =
            allocationInputs[leg.token.id] ??
            (allocationInputUnit === 'usd' && !unpriced
              ? leg.usd > 0
                ? String(leg.usd)
                : leg.amountFormatted
              : leg.amountFormatted);
          const exceeds = leg.amountRaw > availableToken.rawBalance;
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
                  {vaultUsdcFundingSplits?.get(leg.token.id) != null ? (
                    <Text style={styles.fundingSplit} numberOfLines={2}>
                      {formatVaultUsdcFundingSplit(
                        vaultUsdcFundingSplits.get(leg.token.id)!,
                        spendable,
                      )}
                    </Text>
                  ) : null}
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
                  placeholderTextColor={colors.textSubtle}
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
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
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
          vaultFundingSplit={vaultUsdcFundingSplits?.get(
            getVaultUsdcTaxFundingKey(taxFunding.token.id),
          )}
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
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addTokenButtonText}>Add token</Text>
        </Pressable>
      ) : null}
    </>
  );
}

/** Broadcast mode and token allocation legs. */
export function SendAdvancedDetails(props: SendAdvancedDetailsProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.advanced}>
      <SendConfigurationFields
        broadcastMode={props.broadcastMode}
        onBroadcastModeChange={props.onBroadcastModeChange}
        gasSponsorship={props.gasSponsorship}
        onGasSponsorshipChange={props.onGasSponsorshipChange}
      />
      <View style={styles.advancedDivider} />
      <SendTokenAllocations
        allocationInputUnit={props.allocationInputUnit}
        allocationInputs={props.allocationInputs}
        allocations={props.allocations}
        canAddToken={props.canAddToken}
        gasFunding={props.gasFunding}
        onAddToken={props.onAddToken}
        onAllocationAmountChange={props.onAllocationAmountChange}
        onAllocationInputUnitChange={props.onAllocationInputUnitChange}
        onOpenStrategyPicker={props.onOpenStrategyPicker}
        onRemoveAllocation={props.onRemoveAllocation}
        selectedStrategy={props.selectedStrategy}
        spendableTokens={props.spendableTokens}
        taxFunding={props.taxFunding}
        vaultUsdcFundingSplits={props.vaultUsdcFundingSplits}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  advanced: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: c.rowBorder,
    borderRadius: 12,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  advancedLabel: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
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
    backgroundColor: c.surfaceMuted,
    borderRadius: 8,
    padding: 2,
  },
  unitToggleOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unitToggleOptionActive: {
    backgroundColor: c.surface,
  },
  unitToggleOptionPressed: {
    opacity: 0.7,
  },
  unitToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textMuted,
  },
  unitToggleTextActive: {
    color: c.primary,
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.rowBorder,
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
    color: c.primary,
  },
  broadcastHint: {
    fontSize: 12,
    lineHeight: 16,
    color: c.textSubtle,
  },
  strategyRowPressed: {
    opacity: 0.7,
  },
  strategyRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
    marginRight: 12,
  },
  strategyRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
    marginRight: 8,
  },
  allocationEmpty: {
    fontSize: 14,
    color: c.textSubtle,
    paddingVertical: 10,
  },
  allocationRow: {
    paddingVertical: 10,
    gap: 8,
  },
  taxAllocationRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.rowBorder,
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
    color: c.primary,
  },
  taxBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  allocationMeta: {
    marginTop: 2,
    fontSize: 12,
    color: c.textSubtle,
  },
  fundingSplit: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: c.textMuted,
    fontVariant: ['tabular-nums'],
  },
  allocationBalance: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
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
    color: c.primary,
  },
  allocationInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
    textAlign: 'right',
    backgroundColor: c.bg,
    fontVariant: ['tabular-nums'],
  },
  allocationInputError: {
    borderColor: c.dangerBorder,
  },
  taxAmountBox: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: c.rowBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: c.surfaceHighlight,
  },
  taxAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textMuted,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  allocationSecondary: {
    minWidth: 64,
    maxWidth: 96,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
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
    borderColor: c.inputBorder,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: c.bg,
  },
  addTokenButtonPressed: {
    opacity: 0.7,
  },
  addTokenButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },
  });
}
