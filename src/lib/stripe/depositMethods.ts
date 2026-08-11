export type DepositMethodId =
  | 'stripe-embedded'
  | 'stripe-embedded-components';

export type DepositMethodOption = {
  id: DepositMethodId;
  label: string;
  description: string;
};

/** Deposit providers shown in the home Deposit picker. */
export const DEPOSIT_METHODS: readonly DepositMethodOption[] = [
  {
    id: 'stripe-embedded',
    label: 'Stripe (embedded)',
    description: 'Buy crypto with the Stripe embedded onramp widget.',
  },
  {
    id: 'stripe-embedded-components',
    label: 'Stripe (embedded components)',
    description:
      'Buy crypto with Stripe embedded components (customizable flow).',
  },
] as const;
