import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

/**
 * Add contacts by registered user id or by EVM/Solana addresses.
 */
export function useAddContact() {
  const { userId } = useConvexUserId();
  const addContact = useMutation(api.contacts.add);
  const addByAddresses = useMutation(api.contacts.addByAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const add = useCallback(
    async (contactUserId: Id<'users'>) => {
      if (!userId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsAdding(true);
      setErrorMessage(null);

      try {
        await addContact({
          ownerId: userId,
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
    [addContact, userId],
  );

  const addAddresses = useCallback(
    async (addresses: {
      name: string;
      evmAddress?: string;
      solanaAddress?: string;
    }) => {
      if (!userId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsAdding(true);
      setErrorMessage(null);

      try {
        await addByAddresses({
          ownerId: userId,
          name: addresses.name,
          evmAddress: addresses.evmAddress,
          solanaAddress: addresses.solanaAddress,
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
    [addByAddresses, userId],
  );

  return {
    add,
    addAddresses,
    isAdding,
    errorMessage,
    clearError: () => {
      setErrorMessage(null);
    },
  };
}
