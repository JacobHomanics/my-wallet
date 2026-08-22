import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Expand/collapse state for the supported chains list on Send settings.
 */
export function useSupportedChainsExpanded() {
  const {
    showAdvanced: expanded,
    setShowAdvanced: setExpanded,
    toggleAdvanced: toggleExpanded,
  } = useShowAdvanced('send');

  return { expanded, setExpanded, toggleExpanded };
}
