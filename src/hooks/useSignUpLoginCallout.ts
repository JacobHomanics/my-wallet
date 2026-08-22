import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';

/**
 * Signed-out home banner that opens the login screen.
 */
export function useSignUpLoginCallout() {
  const { isAuthenticated } = useAuth();
  const openLogin = useOpenLogin();

  return {
    isAuthenticated,
    openLogin,
  };
}
