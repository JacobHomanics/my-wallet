import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

/**
 * Add contacts by registered user id or by EVM/Solana addresses.
 */
export function useAddContact() {
  const { user, isReady } = useAuth();
  const addContact = useMutation(api.contacts.add);
  const addByAddresses = useMutation(api.contacts.addByAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolveOwner = useCallback(() => {
    const externalId = isReady ? getPrivyExternalId(user) : null;
    if (!externalId) {
      setErrorMessage('Not signed in');
      return null;
    }
    return externalId;
  }, [isReady, user]);

  const add = useCallback(
    async (contactUserId: Id<'users'>) => {
      const externalId = resolveOwner();
      if (!externalId) {
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
    [addContact, resolveOwner],
  );

  const addAddresses = useCallback(
    async (addresses: {
      name: string;
      evmAddress?: string;
      solanaAddress?: string;
    }) => {
      const externalId = resolveOwner();
      if (!externalId) {
        return false;
      }

      setIsAdding(true);
      setErrorMessage(null);

      try {
        await addByAddresses({
          ownerExternalId: externalId,
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
    [addByAddresses, resolveOwner],
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
