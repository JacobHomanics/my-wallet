export type PaymentStrategyId =
  | 'prioritize-stablecoins'
  | 'even-split'
  | 'prioritize-stablecoins-even-split';

export type PaymentStrategy = {
  id: PaymentStrategyId;
  label: string;
  description: string;
};

export const PAYMENT_STRATEGIES: readonly PaymentStrategy[] = [
  {
    id: 'prioritize-stablecoins-even-split',
    label: 'Prioritize Stablecoins then Even Split',
    description:
      'Split evenly across stablecoins first, then other tokens. Gas tokens are last resort.',
  },
  {
    id: 'prioritize-stablecoins',
    label: 'Prioritize Stablecoins',
    description:
      'Use stablecoins first when funding a USD payment, then other tokens. Gas tokens are last resort.',
  },
  {
    id: 'even-split',
    label: 'Even Split',
    description:
      'Split the payment evenly across tokens. Gas tokens are used only if needed.',
  },
] as const;

export const DEFAULT_PAYMENT_STRATEGY_ID: PaymentStrategyId =
  'prioritize-stablecoins-even-split';

export function getPaymentStrategy(
  id: PaymentStrategyId,
): PaymentStrategy | undefined {
  return PAYMENT_STRATEGIES.find((strategy) => strategy.id === id);
}
