import { useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useSignUpLoginPromptModal } from '@/hooks/useSignUpLoginPromptModal';

/**
 * Runs an action when signed in; otherwise opens the sign up / login prompt.
 */
export function useAuthGatedAction(action: () => void) {
  const { isAuthenticated } = useAuth();
  const { promptOpen, openPrompt, closePrompt, confirmPrompt } =
    useSignUpLoginPromptModal();

  const run = useCallback(() => {
    if (!isAuthenticated) {
      openPrompt();
      return;
    }

    action();
  }, [action, isAuthenticated, openPrompt]);

  return {
    run,
    openAuthPrompt: openPrompt,
    authPromptOpen: promptOpen,
    closeAuthPrompt: closePrompt,
    confirmAuthPrompt: confirmPrompt,
  };
}
