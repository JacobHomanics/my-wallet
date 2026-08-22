import { useCallback } from 'react';

import { useContactsTab } from '@/hooks/useContactsTab';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';

/**
 * Contacts All / Contacts / External tabs, independent of recipient search.
 * Default (and Advanced with Contacts off) starts on ZitiCashbox contacts
 * until advanced details are shown.
 */
export function useContactsAdvancedSection() {
  const {
    isAdvanced,
    showAdvanced,
    toggleAdvanced,
    showAdvancedToggle,
  } = useShowAdvanced('contacts');
  const {
    selectedTab,
    isAllTab,
    isContactsTab,
    isExternalTab,
    selectAll,
    selectContacts,
    selectExternal,
  } = useContactsTab('all');

  const toggleContactsAdvanced = useCallback(() => {
    if (!showAdvanced) {
      selectAll();
    }
    toggleAdvanced();
  }, [selectAll, showAdvanced, toggleAdvanced]);

  const showContactsTabs = showAdvanced;
  const viewingContactsOnly = !showAdvanced || isContactsTab;

  return {
    showContactsTabs,
    showContactsAdvancedToggle: showAdvancedToggle,
    showContactsAdvanced: showAdvanced,
    toggleContactsAdvanced,
    selectedTab: viewingContactsOnly ? 'contacts' : selectedTab,
    isAllTab: showAdvanced && isAllTab,
    isContactsTab: viewingContactsOnly,
    isExternalTab: showAdvanced && isExternalTab,
    selectAll,
    selectContacts,
    selectExternal,
    isAdvanced,
  };
}
