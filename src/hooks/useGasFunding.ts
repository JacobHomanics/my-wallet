import { useMemo } from 'react';

import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { TaxFundingPick } from '@/lib/send/buildPaymentLegsWithTax';
import {
  resolveGasFundingForPayment,
  type GasFundingPick,
} from '@/lib/send/gasReserves';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

/** Gas reserved for this payment's legs (e.g. USDC gas when sending Base USDC). */
export function useGasFunding(
  walletTokens: OwnedToken[],
  allocations: readonly PaymentAllocation[] = [],
  taxFunding?: TaxFundingPick | null,
): GasFundingPick[] {
  return useMemo(
    () => resolveGasFundingForPayment(walletTokens, allocations, taxFunding),
    [allocations, taxFunding, walletTokens],
  );
}
