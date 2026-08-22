import { useAppLayout } from '@/hooks/useAppLayout';
import { useAdvancedLayoutSections } from '@/hooks/useAdvancedLayoutSections';
import type { AdvancedLayoutSectionId } from '@/lib/advancedLayoutSections';

/**
 * Whether a given area should use Advanced presentation: Advanced layout is
 * selected and this section’s toggle is on.
 */
export function useAdvancedSection(sectionId: AdvancedLayoutSectionId): {
  isAdvanced: boolean;
} {
  const { isAdvanced: layoutIsAdvanced } = useAppLayout();
  const { enabledById } = useAdvancedLayoutSections();

  return {
    isAdvanced: layoutIsAdvanced && enabledById[sectionId],
  };
}
