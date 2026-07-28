export type PaymentStrategyId = 'prioritize-stablecoins';

export type PaymentStrategy = {
  id: PaymentStrategyId;
  label: string;
  description: string;
};

export const PAYMENT_STRATEGIES: readonly PaymentStrategy[] = [
  {
    id: 'prioritize-stablecoins',
    label: 'Prioritize Stablecoins',
    description: 'Prefer stablecoins when choosing which token to send.',
  },
] as const;

export const DEFAULT_PAYMENT_STRATEGY_ID: PaymentStrategyId =
  'prioritize-stablecoins';

export function getPaymentStrategy(
  id: PaymentStrategyId,
): PaymentStrategy | undefined {
  return PAYMENT_STRATEGIES.find((strategy) => strategy.id === id);
}
