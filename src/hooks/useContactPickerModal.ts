import { useCallback, useState } from 'react';

/**
 * Open / close state for the send recipient contact picker modal.
 */
export function useContactPickerModal(initial = false) {
  const [pickerOpen, setPickerOpen] = useState(initial);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  return { pickerOpen, openPicker, closePicker };
}
