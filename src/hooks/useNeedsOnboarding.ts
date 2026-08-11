import { useQuery } from 'convex/react';

import { useAuth } from '@/hooks/useAuth';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';

export type OnboardingStatus = 'idle' | 'loading' | 'needed' | 'done';

/**
 * Whether the signed-in Convex user still needs first-time onboarding.
 * Completed only when `onboardingCompleted` is explicitly `true`.
 */
export function useNeedsOnboarding(): {
  status: OnboardingStatus;
  needsOnboarding: boolean;
  isLoading: boolean;
} {
  const { user, isReady, isAuthenticated } = useAuth();
  const externalId =
    isReady && isAuthenticated ? getPrivyExternalId(user) : null;

  const convexUser = useQuery(
    api.users.getByExternalId,
    externalId ? { externalId } : 'skip',
  );

  if (!isReady || !isAuthenticated) {
    return { status: 'idle', needsOnboarding: false, isLoading: false };
  }

  if (!externalId || convexUser === undefined || convexUser === null) {
    return { status: 'loading', needsOnboarding: false, isLoading: true };
  }

  if (convexUser.onboardingCompleted === true) {
    return { status: 'done', needsOnboarding: false, isLoading: false };
  }

  return { status: 'needed', needsOnboarding: true, isLoading: false };
}
