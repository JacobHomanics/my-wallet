import { useCallback } from 'react';

import { useContactsPreview } from '@/hooks/useContactsPreview';
import type { ContactListItem } from '@/hooks/useContacts';

/**
 * Whether a contact can be chosen as a send recipient.
 * Sample contacts are all selectable when signed out.
 */
export function useCanSelectContact() {
  const { isPreview } = useContactsPreview();

  return useCallback(
    (contact: ContactListItem) =>
      isPreview ||
      Boolean(contact.identityId || contact.evmAddress || contact.solanaAddress),
    [isPreview],
  );
}
