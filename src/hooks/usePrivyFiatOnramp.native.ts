import type { UsePrivyFiatOnrampResult } from '@/hooks/usePrivyFiatOnramp.shared';

/**
 * Native stub — Privy `useFiatOnramp` (Stripe embedded components) is web-only.
 */
export function usePrivyFiatOnramp(): UsePrivyFiatOnrampResult {
  return {
    isAvailable: false,
    isFunding: false,
    status: null,
    error: 'Card deposits via Privy are available on web for now.',
    startFund: async () => null,
  };
}
