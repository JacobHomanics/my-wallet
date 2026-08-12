import { useCallback, useState } from 'react';

/**
 * Open / close state for the withdraw unsupported modal.
 */
export function useWithdrawUnsupportedModal(initial = false) {
  const [withdrawOpen, setWithdrawOpen] = useState(initial);

  const openWithdraw = useCallback(() => {
    setWithdrawOpen(true);
  }, []);

  const closeWithdraw = useCallback(() => {
    setWithdrawOpen(false);
  }, []);

  return { withdrawOpen, openWithdraw, closeWithdraw };
}
