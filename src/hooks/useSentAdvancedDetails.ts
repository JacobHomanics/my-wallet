import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Token-leg receipt details: always visible when Send is Advanced, toggled otherwise.
 */
export function useSentAdvancedDetails() {
  const {
    isAdvanced,
    showAdvanced,
    toggleAdvanced,
    showAdvancedToggle,
  } = useShowAdvanced('send');

  return {
    isAdvanced,
    showAdvanced,
    toggleAdvanced,
    showTokenDetails: showAdvanced,
    showAdvancedToggle,
  };
}
