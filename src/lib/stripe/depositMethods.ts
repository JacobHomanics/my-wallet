export type DepositMethodId =
  | 'stripe-embedded'
  | 'stripe-embedded-components'
  | 'stripe-headless';

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
    description: 'Full-screen embedded Stripe onramp.',
  },
  {
    id: 'stripe-embedded-components',
    label: 'Privy (pre-built components)',
    description: 'Privy modal flow with built-in funding providers.',
  },
  {
    id: 'stripe-headless',
    label: 'Stripe (headless)',
    description: 'Native checkout built on Stripe Embedded Components.',
  },
] as const;

export const DEFAULT_DEPOSIT_METHOD_ID: DepositMethodId =
  'stripe-embedded-components';

export function getDepositMethodOption(
  id: DepositMethodId,
): DepositMethodOption | null {
  return DEPOSIT_METHODS.find((option) => option.id === id) ?? null;
}
