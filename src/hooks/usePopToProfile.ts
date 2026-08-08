import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '@/navigation/types';

/**
 * Returns to the profile screen with a back animation when possible.
 * Falls back to resetting the stack when opened directly (e.g. refresh on /settings).
 */
export function usePopToProfile() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return useCallback(() => {
    const state = navigation.getState();
    const profileRouteIndex = state.routes.findIndex(
      (route) => route.name === 'index',
    );

    if (profileRouteIndex >= 0 && state.index > profileRouteIndex) {
      navigation.pop(state.index - profileRouteIndex);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'index' }],
    });
  }, [navigation]);
}
