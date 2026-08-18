import { useMemo } from 'react';

import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { TaxFundingPick } from '@/lib/send/buildPaymentLegsWithTax';
import {
  resolveGasFunding,
  type GasFundingPick,
} from '@/lib/send/gasReserves';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

function paymentNetworksInUse(
  allocations: readonly PaymentAllocation[],
  taxFunding?: TaxFundingPick | null,
): Set<string> {
  const networks = new Set<string>();
  for (const leg of allocations) {
    if (leg.amountRaw > 0n || leg.usd > 0) {
      networks.add(leg.token.network);
    }
  }
  if (taxFunding != null && taxFunding.amountRaw > 0n) {
    networks.add(taxFunding.token.network);
  }
  return networks;
}

function txCountByNetwork(
  allocations: readonly PaymentAllocation[],
  taxFunding?: TaxFundingPick | null,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const leg of allocations) {
    if (leg.amountRaw > 0n || leg.usd > 0) {
      counts.set(leg.token.network, (counts.get(leg.token.network) ?? 0) + 1);
    }
  }
  if (taxFunding != null && taxFunding.amountRaw > 0n) {
    counts.set(
      taxFunding.token.network,
      (counts.get(taxFunding.token.network) ?? 0) + 1,
    );
  }
  return counts;
}

/** Gas reserved per fee-paying token for fee headroom on payment networks. */
export function useGasFunding(
  walletTokens: OwnedToken[],
  spendableTokens: OwnedToken[],
  allocations: readonly PaymentAllocation[] = [],
  taxFunding?: TaxFundingPick | null,
): GasFundingPick[] {
  return useMemo(() => {
    const usedNetworks = paymentNetworksInUse(allocations, taxFunding);
    if (usedNetworks.size === 0) {
      return [];
    }
    return resolveGasFunding(
      walletTokens,
      spendableTokens,
      usedNetworks,
      txCountByNetwork(allocations, taxFunding),
    );
  }, [allocations, taxFunding, walletTokens, spendableTokens]);
}
