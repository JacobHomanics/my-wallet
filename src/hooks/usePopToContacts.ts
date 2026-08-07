import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '@/navigation/types';

/**
 * Returns to the contacts screen with a back animation when possible.
 * Falls back to resetting onto contacts when opened directly (e.g. /contacts/new).
 */
export function usePopToContacts() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return useCallback(() => {
    const state = navigation.getState();
    const contactsRouteIndex = state.routes.findIndex(
      (route) => route.name === 'contacts',
    );

    if (contactsRouteIndex >= 0 && state.index > contactsRouteIndex) {
      navigation.pop(state.index - contactsRouteIndex);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 1,
      routes: [{ name: 'index' }, { name: 'contacts' }],
    });
  }, [navigation]);
}
