import { CommonActions, useNavigation } from '@react-navigation/native';

import { useAuth } from '@/hooks/useAuth';

export type SignOutNavigation = {
  dispatch: (action: object) => void;
  getParent?: () => SignOutNavigation | undefined;
};

function getRootNavigation(navigation: SignOutNavigation) {
  let current = navigation;
  let parent = current.getParent?.();

  while (parent) {
    current = parent;
    parent = current.getParent?.();
  }

  return current;
}

export async function signOutAndReset(
  logout: () => Promise<void>,
  navigation: SignOutNavigation,
) {
  await logout();
  getRootNavigation(navigation).dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'welcome' }],
    }),
  );
}

export function useSignOut() {
  const { logout } = useAuth();
  const navigation = useNavigation();

  return {
    signOut: () =>
      signOutAndReset(logout, navigation as unknown as SignOutNavigation),
  };
}
