export type DepositMethodId =
  | 'stripe-embedded'
  | 'stripe-embedded-components';

export type DepositMethodOption = {
  id: DepositMethodId;
  label: string;
};

/** Deposit providers shown in the home Deposit picker. */
export const DEPOSIT_METHODS: readonly DepositMethodOption[] = [
  {
    id: 'stripe-embedded',
    label: 'Stripe (embedded)',
  },
  {
    id: 'stripe-embedded-components',
    label: 'Privy (pre-built components)',
  },
] as const;
