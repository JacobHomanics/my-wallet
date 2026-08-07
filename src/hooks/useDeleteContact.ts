import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * Delete an owned contact by id.
 */
export function useDeleteContact() {
  const { userId } = useConvexUserId();
  const removeContact = useMutation(api.contacts.remove);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const remove = useCallback(
    async (contactId: string) => {
      if (!userId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsDeleting(true);
      setErrorMessage(null);

      try {
        await removeContact({
          ownerId: userId,
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
    [removeContact, userId],
  );

  return {
    remove,
    isDeleting,
    errorMessage,
  };
}
