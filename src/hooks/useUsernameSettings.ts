import { useMutation } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useConvexUsername } from '@/hooks/useConvexUsername';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import {
  isValidUsername,
  normalizeUsername,
} from '@/lib/validation';
import { api } from '../../convex/_generated/api';

/**
 * Draft + save flow for editing Convex `users.username` in settings.
 */
export function useUsernameSettings() {
  const { user, isReady } = useAuth();
  const { username, isLoading } = useConvexUsername();
  const setUsername = useMutation(api.users.setUsername);

  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const syncedFromRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const current = username ?? '';
    if (syncedFromRef.current === current) {
      return;
    }

    syncedFromRef.current = current;
    setDraft(current);
    setErrorMessage(null);
  }, [isLoading, username]);

  const onChangeDraft = useCallback((value: string) => {
    setDraft(value);
    setErrorMessage(null);
  }, []);

  const normalizedDraft = normalizeUsername(draft);
  const currentUsername = username ?? '';
  const isDirty = normalizedDraft !== currentUsername;
  const isValid = isValidUsername(draft);
  const canSave = isDirty && isValid && !isSaving && !isLoading;

  const save = useCallback(async () => {
    if (!canSave) {
      return;
    }

    const externalId = isReady ? getPrivyExternalId(user) : null;
    if (!externalId) {
      setErrorMessage('Not signed in');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await setUsername({
        externalId,
        username: normalizedDraft.length > 0 ? normalizedDraft : undefined,
      });
      syncedFromRef.current = normalizedDraft;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save username';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    canSave,
    isReady,
    normalizedDraft,
    setUsername,
    user,
  ]);

  return {
    draft,
    onChangeDraft,
    save,
    canSave,
    isSaving,
    isLoading,
    errorMessage,
    isDirty,
    isValid,
  };
}
