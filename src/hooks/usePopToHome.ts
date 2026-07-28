import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '@/navigation/types';

/**
 * Returns to the home screen with a back animation when possible.
 * Falls back to resetting the stack when opened directly (e.g. page refresh on /send).
 */
export function usePopToHome() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return useCallback(() => {
    const state = navigation.getState();
    const homeRouteIndex = state.routes.findIndex(
      (route) => route.name === 'index',
    );

    if (homeRouteIndex >= 0 && state.index > homeRouteIndex) {
      navigation.pop(state.index - homeRouteIndex);
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
