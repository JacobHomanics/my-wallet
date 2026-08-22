import { useAppLayout } from '@/hooks/useAppLayout';
import { useNeedsOnboarding } from '@/hooks/useNeedsOnboarding';
import type { RootStackParamList } from '@/navigation/types';

export type AuthenticatedDestination = Extract<
  keyof RootStackParamList,
  'onboarding' | 'chooseAppLayout' | 'main'
>;

/**
 * Where a signed-in user should land: profile onboarding, layout choice, or main.
 */
export function useAuthenticatedDestination(): {
  destination: AuthenticatedDestination | null;
  isReady: boolean;
} {
  const { status } = useNeedsOnboarding();
  const { hasAppLayoutBeenSet } = useAppLayout();

  if (status === 'idle' || status === 'loading') {
    return { destination: null, isReady: false };
  }

  if (status === 'needed') {
    return { destination: 'onboarding', isReady: true };
  }

  if (!hasAppLayoutBeenSet) {
    return { destination: 'chooseAppLayout', isReady: true };
  }

  return { destination: 'main', isReady: true };
}
