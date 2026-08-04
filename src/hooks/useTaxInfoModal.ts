import { useCallback, useState } from 'react';

/**
 * Open / close state for the tax info modal.
 */
export function useTaxInfoModal(initial = false) {
  const [taxInfoOpen, setTaxInfoOpen] = useState(initial);

  const openTaxInfo = useCallback(() => {
    setTaxInfoOpen(true);
  }, []);

  const closeTaxInfo = useCallback(() => {
    setTaxInfoOpen(false);
  }, []);

  return { taxInfoOpen, openTaxInfo, closeTaxInfo };
}
