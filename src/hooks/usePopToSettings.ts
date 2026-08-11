import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '@/navigation/types';

/**
 * Returns to settings with a back animation when possible.
 * Falls back to resetting onto settings when opened directly.
 */
export function usePopToSettings() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return useCallback(() => {
    const state = navigation.getState();
    const settingsRouteIndex = state.routes.findIndex(
      (route) => route.name === 'settings',
    );

    if (settingsRouteIndex >= 0 && state.index > settingsRouteIndex) {
      navigation.pop(state.index - settingsRouteIndex);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 1,
      routes: [{ name: 'index' }, { name: 'settings' }],
    });
  }, [navigation]);
}
