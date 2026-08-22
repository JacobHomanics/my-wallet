import { useAppLayout } from '@/hooks/useAppLayout';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Token-leg receipt details: always visible in Advanced layout, toggled in Default.
 */
export function useSentAdvancedDetails() {
  const { isAdvanced } = useAppLayout();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();

  return {
    isAdvanced,
    showAdvanced,
    toggleAdvanced,
    showTokenDetails: isAdvanced || showAdvanced,
    showAdvancedToggle: !isAdvanced,
  };
}
