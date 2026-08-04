import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Collapsible tax-details section on confirm send.
 */
export function useShowTaxDetails(initial = false) {
  const { showAdvanced: showTaxDetails, toggleAdvanced: toggleTaxDetails } =
    useShowAdvanced(initial);

  return { showTaxDetails, toggleTaxDetails };
}
