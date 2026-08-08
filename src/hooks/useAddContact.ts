import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

/**
 * Add contacts by registered user id, addresses, or Farcaster profile.
 */
export function useAddContact() {
  const { userId } = useConvexUserId();
  const addContact = useMutation(api.contacts.add);
  const addByAddresses = useMutation(api.contacts.addByAddresses);
  const addByFarcaster = useMutation(api.contacts.addByFarcaster);
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

  const addFarcaster = useCallback(
    async (profile: {
      farcasterFid: number;
      farcasterUsername: string;
      farcasterPfpUrl?: string | null;
      name?: string | null;
      evmAddress?: string | null;
      solanaAddress?: string | null;
    }) => {
      if (!userId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsAdding(true);
      setErrorMessage(null);

      try {
        await addByFarcaster({
          ownerId: userId,
          farcasterFid: profile.farcasterFid,
          farcasterUsername: profile.farcasterUsername,
          farcasterPfpUrl: profile.farcasterPfpUrl ?? undefined,
          name: profile.name ?? undefined,
          evmAddress: profile.evmAddress ?? undefined,
          solanaAddress: profile.solanaAddress ?? undefined,
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
    [addByFarcaster, userId],
  );

  return {
    add,
    addAddresses,
    addFarcaster,
    isAdding,
    errorMessage,
    clearError: () => {
      setErrorMessage(null);
    },
  };
}
