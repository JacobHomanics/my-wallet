import { useEnsureConvexUser } from '@/hooks/useEnsureConvexUser';

/** Mounts Convex user-row ensure logic for authenticated users. */
export function EnsureConvexUser() {
  useEnsureConvexUser();
  return null;
}
