import { useCallback, useState } from 'react';

import { useSignOut } from '@/hooks/useSignOut';

/**
 * Opens a confirm modal before signing out.
 */
export function useConfirmSignOut() {
  const { signOut } = useSignOut();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const requestSignOut = useCallback(() => {
    setConfirmVisible(true);
  }, []);

  const cancelSignOut = useCallback(() => {
    if (isSigningOut) {
      return;
    }
    setConfirmVisible(false);
  }, [isSigningOut]);

  const confirmSignOut = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
      setConfirmVisible(false);
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, signOut]);

  return {
    confirmVisible,
    isSigningOut,
    requestSignOut,
    cancelSignOut,
    confirmSignOut,
  };
}
