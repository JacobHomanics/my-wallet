import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { DepositMethodOption } from '@/lib/stripe/depositMethods';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Open / close state for the home deposit method picker, plus navigation on select.
 */
export function useDepositMethodPicker() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const onSelectMethod = useCallback(
    (method: DepositMethodOption) => {
      setPickerOpen(false);
      if (method.id === 'stripe-embedded') {
        navigation.navigate('stripeOnramp');
        return;
      }
      navigation.navigate('stripeOnrampComponents');
    },
    [navigation],
  );

  return { pickerOpen, openPicker, closePicker, onSelectMethod };
}
