import { useCallback, useState } from 'react';

import { useAppLayout } from '@/hooks/useAppLayout';
import type { AppLayoutId, AppLayoutOption } from '@/lib/appLayout';

/**
 * App layout picker for settings.
 */
export function useAppLayoutPicker() {
  const { options, selectedLayout, selectedAppLayoutId, setAppLayout } =
    useAppLayout();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const onSelectOption = useCallback(
    (option: AppLayoutOption) => {
      setAppLayout(option.id);
      setPickerOpen(false);
    },
    [setAppLayout],
  );

  const selectAppLayout = useCallback(
    (id: AppLayoutId) => {
      setAppLayout(id);
      setPickerOpen(false);
    },
    [setAppLayout],
  );

  return {
    options,
    selectedLayout,
    selectedAppLayoutId,
    pickerOpen,
    openPicker,
    closePicker,
    onSelectOption,
    selectAppLayout,
  };
}
