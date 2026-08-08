import { useCallback, useState } from 'react';

import { useDeleteContact } from '@/hooks/useDeleteContact';

type PendingDelete = {
  contactId: string;
  label: string;
};

/**
 * Confirm-before-delete flow for contacts (list swipe + details header).
 */
export function useConfirmDeleteContact(onDeleted?: () => void) {
  const { remove, isDeleting, errorMessage } = useDeleteContact();
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const requestDelete = useCallback((contactId: string, label: string) => {
    setPending({ contactId, label });
  }, []);

  const cancelDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }
    setPending(null);
  }, [isDeleting]);

  const confirmDelete = useCallback(async () => {
    if (!pending || isDeleting) {
      return false;
    }

    const ok = await remove(pending.contactId);
    if (ok) {
      setPending(null);
      onDeleted?.();
    }
    return ok;
  }, [isDeleting, onDeleted, pending, remove]);

  return {
    confirmVisible: pending != null,
    contactLabel: pending?.label ?? '',
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting,
    errorMessage,
  };
}
