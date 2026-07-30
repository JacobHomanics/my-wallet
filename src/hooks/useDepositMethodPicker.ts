import { useCallback, useState } from 'react';

import { DEPOSIT_METHODS } from '@/lib/privy/onramp';

/**
 * Open/close state for the deposit method picker sheet.
 */
export function useDepositMethodPicker() {
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  return {
    methods: DEPOSIT_METHODS,
    pickerOpen,
    openPicker,
    closePicker,
  };
}
