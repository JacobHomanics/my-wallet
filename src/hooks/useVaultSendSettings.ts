import { useMutation, useQuery } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

/**
 * Withdraw vault USDC into the wallet before sending (stored on Convex `users`).
 */
export function useVaultSendSettings() {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;
  const convexUser = useQuery(
    api.users.getByExternalId,
    externalId ? { externalId } : 'skip',
  );
  const setUseVaultUsdcWhenSending = useMutation(
    api.users.setUseVaultUsdcWhenSending,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const enabled = convexUser?.useVaultUsdcWhenSending !== false;
  const isLoading = externalId != null && convexUser === undefined;

  const setEnabled = useCallback(
    async (value: boolean) => {
      if (!externalId || isSaving) {
        return false;
      }

      setIsSaving(true);
      setErrorMessage(null);

      try {
        await setUseVaultUsdcWhenSending({
          externalId,
          enabled: value,
        });
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update vault send setting';
        setErrorMessage(message);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [externalId, isSaving, setUseVaultUsdcWhenSending],
  );

  return {
    enabled,
    setEnabled,
    isLoading,
    isSaving,
    errorMessage,
  };
}
