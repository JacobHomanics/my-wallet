import { useMemo } from 'react';

import { useAppLayout } from '@/hooks/useAppLayout';
import { useAdvancedLayoutSections } from '@/hooks/useAdvancedLayoutSections';
import type { AdvancedLayoutSectionId } from '@/lib/advancedLayoutSections';

export type AdvancedLayoutSectionToggle = {
  id: AdvancedLayoutSectionId;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
};

/**
 * Appearance settings rows for turning Advanced on or off per section.
 * Hidden unless Advanced layout is selected.
 */
export function useAdvancedLayoutSectionToggles(): {
  visible: boolean;
  rows: AdvancedLayoutSectionToggle[];
} {
  const { isAdvanced } = useAppLayout();
  const { options, enabledById, setSectionEnabled } =
    useAdvancedLayoutSections();

  const rows = useMemo(
    () =>
      options.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
        enabled: enabledById[option.id],
        onToggle: (value: boolean) => {
          setSectionEnabled(option.id, value);
        },
      })),
    [enabledById, options, setSectionEnabled],
  );

  return {
    visible: isAdvanced,
    rows,
  };
}
