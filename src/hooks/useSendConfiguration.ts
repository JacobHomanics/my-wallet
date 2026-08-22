import { useCallback, useState } from 'react';

/**
 * Collapsible send configuration section (broadcast mode and sponsorship).
 */
export function useSendConfiguration() {
  const [showConfiguration, setShowConfiguration] = useState(false);

  const toggleConfiguration = useCallback(() => {
    setShowConfiguration((open) => !open);
  }, []);

  return { showConfiguration, setShowConfiguration, toggleConfiguration };
}
