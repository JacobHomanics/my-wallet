import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ContactsStackParamList } from '@/navigation/types';

/**
 * Returns to the contacts list with a back animation when possible.
 * Falls back to resetting onto contacts index when opened directly.
 */
export function usePopToContacts() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();

  return useCallback(() => {
    const state = navigation.getState();
    const contactsRouteIndex = state.routes.findIndex(
      (route) => route.name === 'index',
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
      index: 0,
      routes: [{ name: 'index' }],
    });
  }, [navigation]);
}
