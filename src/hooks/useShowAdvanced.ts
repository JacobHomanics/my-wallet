import { useCallback, useState } from 'react';

import { useAppLayout } from '@/hooks/useAppLayout';

/**
 * Toggle for “Show / Hide advanced details” sections.
 * Advanced (Money on Steroids) layout starts these sections open.
 */
export function useShowAdvanced(initial?: boolean) {
  const { isAdvanced } = useAppLayout();
  const [showAdvanced, setShowAdvanced] = useState(initial ?? isAdvanced);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced((open) => !open);
  }, []);

  return { showAdvanced, setShowAdvanced, toggleAdvanced };
}
