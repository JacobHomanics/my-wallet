/** Privy user id (DID) from an auth user object, if present. */
export function getPrivyExternalId(user: unknown): string | null {
  if (!user || typeof user !== 'object' || !('id' in user)) {
    return null;
  }

  const id = (user as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}
