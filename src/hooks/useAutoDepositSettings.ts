import { useMutation, useQuery } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

/**
 * Auto-deposit received USDC into the earn vault (stored on Convex `users`).
 */
export function useAutoDepositSettings() {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;
  const convexUser = useQuery(
    api.users.getByExternalId,
    externalId ? { externalId } : 'skip',
  );
  const setAutoDepositReceivedUsdc = useMutation(
    api.users.setAutoDepositReceivedUsdc,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const enabled = convexUser?.autoDepositReceivedUsdc !== false;
  const isLoading = externalId != null && convexUser === undefined;

  const setEnabled = useCallback(
    async (value: boolean) => {
      if (!externalId || isSaving) {
        return false;
      }

      setIsSaving(true);
      setErrorMessage(null);

      try {
        await setAutoDepositReceivedUsdc({
          externalId,
          enabled: value,
        });
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update auto-deposit setting';
        setErrorMessage(message);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [externalId, isSaving, setAutoDepositReceivedUsdc],
  );

  return {
    enabled,
    setEnabled,
    isLoading,
    isSaving,
    errorMessage,
  };
}
