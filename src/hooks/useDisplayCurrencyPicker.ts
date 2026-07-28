import { useCallback, useState } from 'react';

import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import type {
  DisplayCurrencyId,
  DisplayCurrencyOption,
} from '@/lib/displayCurrency';

/**
 * Display currency picker for settings.
 */
export function useDisplayCurrencyPicker() {
  const {
    options,
    selectedCurrency,
    selectedDisplayCurrencyId,
    setDisplayCurrency,
  } = useDisplayCurrency();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const onSelectOption = useCallback(
    (option: DisplayCurrencyOption) => {
      setDisplayCurrency(option.id);
      setPickerOpen(false);
    },
    [setDisplayCurrency],
  );

  const selectDisplayCurrency = useCallback(
    (id: DisplayCurrencyId) => {
      setDisplayCurrency(id);
      setPickerOpen(false);
    },
    [setDisplayCurrency],
  );

  return {
    options,
    selectedCurrency,
    selectedDisplayCurrencyId,
    pickerOpen,
    openPicker,
    closePicker,
    onSelectOption,
    selectDisplayCurrency,
  };
}
