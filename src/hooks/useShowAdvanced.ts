import { useCallback, useState } from 'react';

/**
 * Toggle for “Show / Hide advanced details” sections.
 */
export function useShowAdvanced(initial = false) {
  const [showAdvanced, setShowAdvanced] = useState(initial);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced((open) => !open);
  }, []);

  return { showAdvanced, setShowAdvanced, toggleAdvanced };
}
