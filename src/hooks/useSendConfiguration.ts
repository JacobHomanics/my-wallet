import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Collapsible send configuration section (strategy, tokens, broadcast mode).
 */
export function useSendConfiguration(initial = false) {
  const {
    showAdvanced: showConfiguration,
    setShowAdvanced: setShowConfiguration,
    toggleAdvanced: toggleConfiguration,
  } = useShowAdvanced(initial);

  return { showConfiguration, setShowConfiguration, toggleConfiguration };
}
