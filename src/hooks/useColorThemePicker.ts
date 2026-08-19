import { useCallback, useState } from 'react';

import { useColorTheme } from '@/hooks/useColorTheme';
import type { ColorThemeId, ColorThemeOption } from '@/theme/types';

/**
 * Color theme picker for settings.
 */
export function useColorThemePicker() {
  const { options, selectedTheme, selectedColorThemeId, setColorTheme } =
    useColorTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const onSelectOption = useCallback(
    (option: ColorThemeOption) => {
      setColorTheme(option.id);
      setPickerOpen(false);
    },
    [setColorTheme],
  );

  const selectColorTheme = useCallback(
    (id: ColorThemeId) => {
      setColorTheme(id);
      setPickerOpen(false);
    },
    [setColorTheme],
  );

  return {
    options,
    selectedTheme,
    selectedColorThemeId,
    pickerOpen,
    openPicker,
    closePicker,
    onSelectOption,
    selectColorTheme,
  };
}
