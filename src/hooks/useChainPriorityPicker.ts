import { useCallback, useState } from 'react';

import { useChainPriority } from '@/hooks/useChainPriority';
import type { ChainPriorityId, ChainPriorityOption } from '@/lib/chainPriority';

/**
 * Chain priority picker for settings (persists for the session).
 */
export function useChainPriorityPicker() {
  const {
    options,
    selectedOption,
    selectedChainPriorityId,
    setChainPriority,
  } = useChainPriority();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const onSelectOption = useCallback(
    (option: ChainPriorityOption) => {
      setChainPriority(option.id);
      setPickerOpen(false);
    },
    [setChainPriority],
  );

  const selectChainPriority = useCallback(
    (id: ChainPriorityId) => {
      setChainPriority(id);
      setPickerOpen(false);
    },
    [setChainPriority],
  );

  return {
    options,
    selectedOption,
    selectedChainPriorityId,
    pickerOpen,
    openPicker,
    closePicker,
    onSelectOption,
    selectChainPriority,
  };
}
