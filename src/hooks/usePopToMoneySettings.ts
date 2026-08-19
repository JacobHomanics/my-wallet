import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '@/navigation/types';

/**
 * Returns to money settings with a back animation when possible.
 * Falls back to resetting onto money settings when opened directly.
 */
export function usePopToMoneySettings() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return useCallback(() => {
    const state = navigation.getState();
    const moneySettingsRouteIndex = state.routes.findIndex(
      (route) => route.name === 'moneySettings',
    );

    if (moneySettingsRouteIndex >= 0 && state.index > moneySettingsRouteIndex) {
      navigation.pop(state.index - moneySettingsRouteIndex);
      return;
    }

    navigation.reset({
      index: 2,
      routes: [
        { name: 'index' },
        { name: 'settings' },
        { name: 'moneySettings' },
      ],
    });
  }, [navigation]);
}
