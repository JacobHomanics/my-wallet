import { useCallback, useState } from 'react';

/**
 * Open / close state for the eligible payment info modal.
 */
export function useEligiblePaymentInfoModal(initial = false) {
  const [infoOpen, setInfoOpen] = useState(initial);

  const openInfo = useCallback(() => {
    setInfoOpen(true);
  }, []);

  const closeInfo = useCallback(() => {
    setInfoOpen(false);
  }, []);

  return { infoOpen, openInfo, closeInfo };
}
