export type FiatOnrampDepositStatus = 'submitted' | 'confirmed';

export type UseFiatOnrampDepositResult = {
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  deposit: () => Promise<FiatOnrampDepositStatus | null>;
};

/**
 * Native stub — card onramp uses `@privy-io/react-auth` `useFiatOnramp` on web.
 * Mobile can later use `useFundWallet` from `@privy-io/expo/ui`.
 */
export function useFiatOnrampDeposit(): UseFiatOnrampDepositResult {
  return {
    isAvailable: false,
    isLoading: false,
    error: null,
    deposit: async () => null,
  };
}
