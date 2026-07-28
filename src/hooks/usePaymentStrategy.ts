import { useCallback, useSyncExternalStore } from 'react';

import {
  DEFAULT_PAYMENT_STRATEGY_ID,
  getPaymentStrategy,
  PAYMENT_STRATEGIES,
  type PaymentStrategy,
  type PaymentStrategyId,
} from '@/lib/strategies';

type StrategyListener = () => void;

let selectedStrategyId: PaymentStrategyId = DEFAULT_PAYMENT_STRATEGY_ID;
const listeners = new Set<StrategyListener>();

function subscribe(listener: StrategyListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PaymentStrategyId {
  return selectedStrategyId;
}

export function getDefaultStrategyId(): PaymentStrategyId {
  return getSnapshot();
}

function setSelectedStrategyId(id: PaymentStrategyId): void {
  if (id === selectedStrategyId) {
    return;
  }
  selectedStrategyId = id;
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * Default payment strategy (settings). Send flow may override without changing this.
 */
export function usePaymentStrategy(): {
  strategies: readonly PaymentStrategy[];
  selectedStrategyId: PaymentStrategyId;
  selectedStrategy: PaymentStrategy;
  setStrategy: (id: PaymentStrategyId) => void;
} {
  const selectedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const setStrategy = useCallback((id: PaymentStrategyId) => {
    setSelectedStrategyId(id);
  }, []);

  const selectedStrategy =
    getPaymentStrategy(selectedId) ??
    getPaymentStrategy(DEFAULT_PAYMENT_STRATEGY_ID)!;

  return {
    strategies: PAYMENT_STRATEGIES,
    selectedStrategyId: selectedStrategy.id,
    selectedStrategy,
    setStrategy,
  };
}
