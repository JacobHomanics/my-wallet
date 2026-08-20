import { useMemo } from 'react';

import { useGasSponsorship } from '@/hooks/useGasSponsorship';
import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { TaxFundingPick } from '@/lib/send/buildPaymentLegsWithTax';
import {
  resolveGasFundingForPayment,
  type GasFundingPick,
} from '@/lib/send/gasReserves';
import { sponsoredNetworksForPreference } from '@/lib/privy/gasSponsorshipNetworks';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

/** Gas reserved for this payment's legs (e.g. USDC gas when sending Base USDC). */
export function useGasFunding(
  walletTokens: OwnedToken[],
  allocations: readonly PaymentAllocation[] = [],
  taxFunding?: TaxFundingPick | null,
): GasFundingPick[] {
  const { gasSponsorship } = useGasSponsorship();
  const sponsoredNetworks = useMemo(
    () => sponsoredNetworksForPreference(gasSponsorship),
    [gasSponsorship],
  );

  return useMemo(
    () =>
      resolveGasFundingForPayment(
        walletTokens,
        allocations,
        taxFunding,
        undefined,
        sponsoredNetworks,
      ),
    [allocations, sponsoredNetworks, taxFunding, walletTokens],
  );
}
