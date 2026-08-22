import { useCallback, useState } from 'react';

/**
 * Collapsible tax-details section on amount / confirm send.
 * Always starts closed; not part of Advanced app layout.
 */
export function useShowTaxDetails() {
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  const toggleTaxDetails = useCallback(() => {
    setShowTaxDetails((open) => !open);
  }, []);

  return { showTaxDetails, toggleTaxDetails };
}
