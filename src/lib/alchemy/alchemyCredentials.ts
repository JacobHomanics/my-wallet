/**
 * Client-exposed Alchemy API key (EXPO_PUBLIC_*).
 * Prefer a backend proxy for production rate-limiting / key rotation.
 */
export function getAlchemyApiKey(): string {
  return process.env.EXPO_PUBLIC_ALCHEMY_API_KEY?.trim() ?? '';
}
