import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import type { Tier1IdentityHit } from '@/hooks/useTier1Identity';
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
  const addByEns = useMutation(api.contacts.addByEns);
  const addByBasename = useMutation(api.contacts.addByBasename);
  const addByLens = useMutation(api.contacts.addByLens);
  const addBySns = useMutation(api.contacts.addBySns);
  const addByNostr = useMutation(api.contacts.addByNostr);
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
      name?: string;
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
          name: addresses.name ?? '',
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

  const addEns = useCallback(
    async (profile: {
      ensName: string;
      evmAddress: string;
      ensAvatarUrl?: string | null;
    }) => {
      if (!userId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsAdding(true);
      setErrorMessage(null);

      try {
        await addByEns({
          ownerId: userId,
          ensName: profile.ensName,
          evmAddress: profile.evmAddress,
          ensAvatarUrl: profile.ensAvatarUrl ?? undefined,
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
    [addByEns, userId],
  );

  const addTier1Identity = useCallback(
    async (hit: Tier1IdentityHit) => {
      if (!userId) {
        setErrorMessage('Not signed in');
        return false;
      }

      setIsAdding(true);
      setErrorMessage(null);

      try {
        switch (hit.protocol) {
          case 'basename':
            await addByBasename({
              ownerId: userId,
              basename: hit.basename ?? hit.label,
              evmAddress: hit.evmAddress ?? '',
              basenameAvatarUrl: hit.avatarUrl ?? undefined,
              name: hit.displayName ?? undefined,
            });
            break;
          case 'lens':
            await addByLens({
              ownerId: userId,
              lensAccount: hit.lensAccount ?? hit.evmAddress ?? '',
              lensHandle: hit.lensHandle ?? hit.label.replace(/^@lens\//i, ''),
              evmAddress: hit.evmAddress ?? '',
              lensAvatarUrl: hit.avatarUrl ?? undefined,
              name: hit.displayName ?? undefined,
            });
            break;
          case 'sns':
            await addBySns({
              ownerId: userId,
              snsDomain: hit.snsDomain ?? hit.label,
              solanaAddress: hit.solanaAddress ?? '',
              name: hit.displayName ?? undefined,
            });
            break;
          case 'nostr':
            await addByNostr({
              ownerId: userId,
              nostrNip05: hit.nostrNip05 ?? hit.label,
              nostrPubkey: hit.nostrPubkey ?? '',
              evmAddress: hit.evmAddress ?? undefined,
              nostrAvatarUrl: hit.avatarUrl ?? undefined,
              name: hit.displayName ?? undefined,
            });
            break;
        }
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
    [addByBasename, addByLens, addByNostr, addBySns, userId],
  );

  return {
    add,
    addAddresses,
    addFarcaster,
    addEns,
    addTier1Identity,
    isAdding,
    errorMessage,
    clearError: () => {
      setErrorMessage(null);
    },
  };
}
