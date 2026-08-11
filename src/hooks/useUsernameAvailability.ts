import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import {
  isValidUsername,
  normalizeUsername,
} from '@/lib/validation';
import { api } from '../../convex/_generated/api';

const DEBOUNCE_MS = 300;

export type UsernameAvailabilityStatus =
  | 'idle'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken';

/**
 * Debounced uniqueness check for a username draft against Convex users.
 */
export function useUsernameAvailability(draft: string): {
  status: UsernameAvailabilityStatus;
  isAvailable: boolean;
  isChecking: boolean;
} {
  const { user, isReady } = useAuth();
  const externalId = isReady ? getPrivyExternalId(user) : null;
  const normalized = normalizeUsername(draft);
  const formatOk =
    normalized.length >= 3 && isValidUsername(draft) && normalized.length > 0;

  const [debounced, setDebounced] = useState(normalized);

  useEffect(() => {
    if (!formatOk) {
      return;
    }

    const timer = setTimeout(() => {
      setDebounced(normalized);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [formatOk, normalized]);

  const result = useQuery(
    api.users.isUsernameAvailable,
    formatOk && debounced === normalized && debounced.length >= 3
      ? {
          username: debounced,
          excludeExternalId: externalId ?? undefined,
        }
      : 'skip',
  );

  if (!formatOk) {
    return {
      status: normalized.length === 0 ? 'idle' : 'invalid',
      isAvailable: false,
      isChecking: false,
    };
  }

  if (debounced !== normalized || result === undefined) {
    return {
      status: 'checking',
      isAvailable: false,
      isChecking: true,
    };
  }

  if (result.available) {
    return {
      status: 'available',
      isAvailable: true,
      isChecking: false,
    };
  }

  return {
    status: result.reason === 'invalid' ? 'invalid' : 'taken',
    isAvailable: false,
    isChecking: false,
  };
}
