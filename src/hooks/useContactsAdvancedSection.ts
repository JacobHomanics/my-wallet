import { useCallback } from 'react';

import { useAppLayout } from '@/hooks/useAppLayout';
import { useContactsTab } from '@/hooks/useContactsTab';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Contacts All / Contacts / External tabs, independent of recipient search.
 * Default layout starts on ZitiCashbox contacts until advanced details are shown.
 */
export function useContactsAdvancedSection() {
  const { isAdvanced } = useAppLayout();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const {
    selectedTab,
    isAllTab,
    isContactsTab,
    isExternalTab,
    selectAll,
    selectContacts,
    selectExternal,
  } = useContactsTab(isAdvanced ? 'all' : 'contacts');

  const toggleContactsAdvanced = useCallback(() => {
    if (showAdvanced) {
      selectContacts();
    }
    toggleAdvanced();
  }, [selectContacts, showAdvanced, toggleAdvanced]);

  const showContactsTabs = showAdvanced;
  const viewingContactsOnly = !showAdvanced || isContactsTab;

  return {
    showContactsTabs,
    showContactsAdvancedToggle: !isAdvanced,
    showContactsAdvanced: showAdvanced,
    toggleContactsAdvanced,
    selectedTab: viewingContactsOnly ? 'contacts' : selectedTab,
    isAllTab: showAdvanced && isAllTab,
    isContactsTab: viewingContactsOnly,
    isExternalTab: showAdvanced && isExternalTab,
    selectAll,
    selectContacts,
    selectExternal,
  };
}
