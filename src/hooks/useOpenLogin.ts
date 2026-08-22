import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';

type NestedNavigation = {
  getParent?: () => NestedNavigation | undefined;
  navigate: (...args: never[]) => void;
};

function getRootNavigation(navigation: NestedNavigation) {
  let current = navigation;
  let parent = current.getParent?.();

  while (parent) {
    current = parent;
    parent = current.getParent?.();
  }

  return current as unknown as NativeStackNavigationProp<RootStackParamList>;
}

/** Opens the root login screen from a nested navigator (e.g. Home). */
export function useOpenLogin() {
  const navigation = useNavigation();

  return useCallback(() => {
    getRootNavigation(navigation as NestedNavigation).navigate('login');
  }, [navigation]);
}
