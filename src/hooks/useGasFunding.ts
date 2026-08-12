import { useMemo } from 'react';

import { useGasSponsorship } from '@/hooks/useGasSponsorship';
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

/** Native gas reserved per gas token for fee headroom on payment networks. */
export function useGasFunding(
  walletTokens: OwnedToken[],
  spendableTokens: OwnedToken[],
  allocations: readonly PaymentAllocation[] = [],
  taxFunding?: TaxFundingPick | null,
): GasFundingPick[] {
  const { gasSponsorship } = useGasSponsorship();

  return useMemo(() => {
    if (gasSponsorship) {
      return [];
    }
    const usedNetworks = paymentNetworksInUse(allocations, taxFunding);
    if (usedNetworks.size === 0) {
      return [];
    }
    return resolveGasFunding(walletTokens, spendableTokens, usedNetworks);
  }, [allocations, gasSponsorship, taxFunding, walletTokens, spendableTokens]);
}
