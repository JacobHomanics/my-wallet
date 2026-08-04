import { useCallback, useState } from 'react';

/**
 * Open / close state for the account number info modal.
 */
export function useAccountNumberInfoModal(initial = false) {
  const [infoOpen, setInfoOpen] = useState(initial);

  const openInfo = useCallback(() => {
    setInfoOpen(true);
  }, []);

  const closeInfo = useCallback(() => {
    setInfoOpen(false);
  }, []);

  return { infoOpen, openInfo, closeInfo };
}
