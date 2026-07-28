import { useCallback } from 'react';

import {
  getSendDraftSnapshot,
  updateSendDraft,
  useSendDraft,
} from '@/hooks/useSendDraft';
import { getDefaultStrategyId } from '@/hooks/usePaymentStrategy';
import {
  DEFAULT_PAYMENT_STRATEGY_ID,
  getPaymentStrategy,
  PAYMENT_STRATEGIES,
  type PaymentStrategy,
  type PaymentStrategyId,
} from '@/lib/strategies';

/**
 * Strategy for the current send flow. Starts from the default strategy and
 * can be overridden per send without changing settings.
 */
export function useSendStrategy(): {
  strategies: readonly PaymentStrategy[];
  selectedStrategyId: PaymentStrategyId;
  selectedStrategy: PaymentStrategy;
  setStrategy: (id: PaymentStrategyId) => void;
} {
  const draft = useSendDraft();
  const selectedStrategyId = draft.strategyId ?? getDefaultStrategyId();
  const selectedStrategy =
    getPaymentStrategy(selectedStrategyId) ??
    getPaymentStrategy(DEFAULT_PAYMENT_STRATEGY_ID)!;

  const setStrategy = useCallback((id: PaymentStrategyId) => {
    updateSendDraft({ strategyId: id });
  }, []);

  return {
    strategies: PAYMENT_STRATEGIES,
    selectedStrategyId: selectedStrategy.id,
    selectedStrategy,
    setStrategy,
  };
}

/** Resolved send strategy id (draft override or default). */
export function getSendStrategyId(): PaymentStrategyId {
  const draft = getSendDraftSnapshot();
  return draft.strategyId ?? getDefaultStrategyId();
}
