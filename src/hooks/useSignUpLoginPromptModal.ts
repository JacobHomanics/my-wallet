import { useCallback, useState } from 'react';

import { useOpenLogin } from '@/hooks/useOpenLogin';

/**
 * Prompt to sign up / log in before a signed-out action.
 */
export function useSignUpLoginPromptModal() {
  const openLogin = useOpenLogin();
  const [promptOpen, setPromptOpen] = useState(false);

  const openPrompt = useCallback(() => {
    setPromptOpen(true);
  }, []);

  const closePrompt = useCallback(() => {
    setPromptOpen(false);
  }, []);

  const confirmPrompt = useCallback(() => {
    setPromptOpen(false);
    openLogin();
  }, [openLogin]);

  return { promptOpen, openPrompt, closePrompt, confirmPrompt };
}
