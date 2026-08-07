import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * Delete an owned contact by id.
 */
export function useDeleteContact() {
  const { user, isReady } = useAuth();
  const removeContact = useMutation(api.contacts.remove);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const remove = useCallback(
    async (contactId: string) => {
      const externalId = isReady ? getPrivyExternalId(user) : null;
      if (!externalId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsDeleting(true);
      setErrorMessage(null);

      try {
        await removeContact({
          ownerExternalId: externalId,
          contactId: contactId as Id<'contacts'>,
        });
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete contact';
        setErrorMessage(message);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [isReady, removeContact, user],
  );

  return {
    remove,
    isDeleting,
    errorMessage,
  };
}
