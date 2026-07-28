import { useCallback, useState } from 'react';

import { usePaymentStrategy } from '@/hooks/usePaymentStrategy';
import { useSendStrategy } from '@/hooks/useSendStrategy';
import type { PaymentStrategy, PaymentStrategyId } from '@/lib/strategies';

type StrategySource = {
  strategies: readonly PaymentStrategy[];
  selectedStrategy: PaymentStrategy;
  selectedStrategyId: PaymentStrategyId;
  setStrategy: (id: PaymentStrategyId) => void;
};

function useStrategyPickerState({
  strategies,
  selectedStrategy,
  selectedStrategyId,
  setStrategy,
}: StrategySource) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const selectStrategy = useCallback(
    (id: PaymentStrategyId) => {
      setStrategy(id);
      setPickerOpen(false);
    },
    [setStrategy],
  );

  const onSelectStrategy = useCallback(
    (strategy: PaymentStrategy) => {
      selectStrategy(strategy.id);
    },
    [selectStrategy],
  );

  return {
    strategies,
    selectedStrategy,
    selectedStrategyId,
    pickerOpen,
    openPicker,
    closePicker,
    selectStrategy,
    onSelectStrategy,
  };
}

/**
 * Default strategy picker for settings (persists as the app default).
 */
export function useStrategyPicker() {
  const strategy = usePaymentStrategy();
  return useStrategyPickerState(strategy);
}

/**
 * Send-flow strategy picker (starts from default, does not change settings).
 */
export function useSendStrategyPicker() {
  const strategy = useSendStrategy();
  return useStrategyPickerState(strategy);
}
