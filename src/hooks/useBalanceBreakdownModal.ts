import { useCallback, useState } from 'react';

/**
 * Open / close state for the home balance breakdown modal.
 */
export function useBalanceBreakdownModal(initial = false) {
  const [breakdownOpen, setBreakdownOpen] = useState(initial);

  const openBreakdown = useCallback(() => {
    setBreakdownOpen(true);
  }, []);

  const closeBreakdown = useCallback(() => {
    setBreakdownOpen(false);
  }, []);

  return { breakdownOpen, openBreakdown, closeBreakdown };
}
