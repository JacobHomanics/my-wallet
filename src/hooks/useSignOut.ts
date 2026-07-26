import { CommonActions, useNavigation } from '@react-navigation/native';

import { useAuth } from '@/hooks/useAuth';

export function useSignOut() {
  const { logout } = useAuth();
  const navigation = useNavigation();

  const signOut = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'welcome' }],
      }),
    );
  };

  return { signOut };
}
