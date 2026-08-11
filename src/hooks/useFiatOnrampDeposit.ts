import type { DepositMethodId } from '@/lib/privy/onramp';

export type FiatOnrampDepositStatus = 'submitted' | 'confirmed';

export type UseFiatOnrampDepositResult = {
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  deposit: (
    method: DepositMethodId,
  ) => Promise<FiatOnrampDepositStatus | null>;
};

/**
 * Native stub — web supports Stripe embedded onramp and Fund Wallet
 * (`useFundWallet`). Mobile can later use a WebView or `@privy-io/expo/ui`.
 */
export function useFiatOnrampDeposit(): UseFiatOnrampDepositResult {
  return {
    isAvailable: false,
    isLoading: false,
    error: null,
    deposit: async () => null,
  };
}
