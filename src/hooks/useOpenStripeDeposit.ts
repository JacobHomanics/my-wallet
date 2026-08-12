import type { UseOpenStripeDepositResult } from '@/hooks/useOpenStripeDeposit.shared';

/**
 * Native stub — Stripe deposit flows are web-only for now.
 */
export function useOpenStripeDeposit(): UseOpenStripeDepositResult {
  return {
    canDeposit: false,
    openDeposit: () => {},
  };
}
