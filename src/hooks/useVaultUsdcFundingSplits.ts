import { useMemo } from 'react';

import { usePrivyEarn } from '@/hooks/usePrivyEarn';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useVaultSendSettings } from '@/hooks/useVaultSendSettings';
import type { TaxFundingPick } from '@/lib/send/buildPaymentLegsWithTax';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';
import {
  computeVaultUsdcFundingSplits,
  getVaultUsdcTaxFundingKey,
  isVaultUsdcToken,
  type VaultUsdcFundingSplit,
} from '@/lib/privy/vaultUsdc';

/**
 * Per-leg vault vs wallet USDC funding when vault-send is enabled.
 */
export function useVaultUsdcFundingSplits(
  allocations: readonly PaymentAllocation[],
  taxFunding: TaxFundingPick | null | undefined,
): Map<string, VaultUsdcFundingSplit> {
  const { tokens } = useTokenBalances();
  const { enabled: vaultSendEnabled } = useVaultSendSettings();
  const { vault } = usePrivyEarn();

  return useMemo(() => {
    if (!vaultSendEnabled || !vault) {
      return new Map<string, VaultUsdcFundingSplit>();
    }

    const walletToken = tokens.find((token) => isVaultUsdcToken(token, vault));
    const walletBalanceRaw = walletToken?.rawBalance ?? 0n;

    const legs = allocations.map((allocation) => ({
      key: allocation.token.id,
      token: allocation.token,
      amountRaw: allocation.amountRaw,
    }));

    if (taxFunding != null && taxFunding.amountRaw > 0n) {
      legs.push({
        key: getVaultUsdcTaxFundingKey(taxFunding.token.id),
        token: taxFunding.token,
        amountRaw: taxFunding.amountRaw,
      });
    }

    return computeVaultUsdcFundingSplits({
      vault,
      walletBalanceRaw,
      legs,
    });
  }, [allocations, taxFunding, tokens, vault, vaultSendEnabled]);
}
