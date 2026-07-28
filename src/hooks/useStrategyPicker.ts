import { useCallback, useState } from 'react';

import { usePaymentStrategy } from '@/hooks/usePaymentStrategy';
import type { PaymentStrategy, PaymentStrategyId } from '@/lib/strategies';

/**
 * Payment strategy selection plus open/close state for the strategy picker modal.
 */
export function useStrategyPicker() {
  const { strategies, selectedStrategy, selectedStrategyId, setStrategy } =
    usePaymentStrategy();
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
