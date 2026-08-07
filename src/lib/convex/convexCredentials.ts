/** Client-exposed Convex deployment URL (EXPO_PUBLIC_*). */
export function getConvexUrl(): string {
  return process.env.EXPO_PUBLIC_CONVEX_URL?.trim() ?? '';
}
