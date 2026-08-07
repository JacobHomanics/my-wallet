import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

/**
 * Add a Convex user to the authenticated owner's contacts list.
 */
export function useAddContact() {
  const { user, isReady } = useAuth();
  const addContact = useMutation(api.contacts.add);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const add = useCallback(
    async (contactUserId: Id<'users'>) => {
      const externalId = isReady ? getPrivyExternalId(user) : null;
      if (!externalId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsAdding(true);
      setErrorMessage(null);

      try {
        await addContact({
          ownerExternalId: externalId,
          contactUserId,
        });
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to add contact';
        setErrorMessage(message);
        return false;
      } finally {
        setIsAdding(false);
      }
    },
    [addContact, isReady, user],
  );

  return {
    add,
    isAdding,
    errorMessage,
    clearError: () => {
      setErrorMessage(null);
    },
  };
}
