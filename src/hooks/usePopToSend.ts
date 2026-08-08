import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '@/navigation/types';

/**
 * Returns to the Amount screen (or Recipient) with a back animation when possible.
 * Falls back to resetting the stack when opened directly (e.g. page refresh on /send/confirm).
 */
export function usePopToSend() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return useCallback(() => {
    const state = navigation.getState();
    const sendAmountRouteIndex = state.routes.findIndex(
      (route) => route.name === 'sendAmount',
    );

    if (sendAmountRouteIndex >= 0 && state.index > sendAmountRouteIndex) {
      navigation.pop(state.index - sendAmountRouteIndex);
      return;
    }

    const sendRouteIndex = state.routes.findIndex(
      (route) => route.name === 'send',
    );

    if (sendRouteIndex >= 0 && state.index > sendRouteIndex) {
      navigation.pop(state.index - sendRouteIndex);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 2,
      routes: [{ name: 'index' }, { name: 'send' }, { name: 'sendAmount' }],
    });
  }, [navigation]);
}
