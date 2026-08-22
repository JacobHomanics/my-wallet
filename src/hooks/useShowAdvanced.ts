import { useCallback, useState } from 'react';

import { useAdvancedSection } from '@/hooks/useAdvancedSection';
import type { AdvancedLayoutSectionId } from '@/lib/advancedLayoutSections';

/**
 * In-page “Show / Hide advanced details” state for one layout section.
 * When the section is Advanced, details stay visible and the toggle is hidden.
 */
export function useShowAdvanced(sectionId: AdvancedLayoutSectionId): {
  isAdvanced: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (open: boolean | ((current: boolean) => boolean)) => void;
  toggleAdvanced: () => void;
  showAdvancedToggle: boolean;
} {
  const { isAdvanced } = useAdvancedSection(sectionId);
  const [expanded, setExpanded] = useState(false);

  const toggleAdvanced = useCallback(() => {
    setExpanded((open) => !open);
  }, []);

  return {
    isAdvanced,
    showAdvanced: isAdvanced || expanded,
    setShowAdvanced: setExpanded,
    toggleAdvanced,
    showAdvancedToggle: !isAdvanced,
  };
}
