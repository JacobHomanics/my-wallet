import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Expand/collapse state for the supported chains list on Send settings.
 */
export function useSupportedChainsExpanded(initial = false) {
  const {
    showAdvanced: expanded,
    setShowAdvanced: setExpanded,
    toggleAdvanced: toggleExpanded,
  } = useShowAdvanced(initial);

  return { expanded, setExpanded, toggleExpanded };
}
