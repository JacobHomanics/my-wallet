/**
 * Resolve the browser's public IP via our own Convex HTTP endpoint.
 *
 * Required for ACH online mandates: Stripe wants the payer's IP at the moment
 * they accept, and neither the browser nor a Convex action can observe it.
 * Returns `null` when the lookup fails so callers can surface a real error
 * instead of sending Stripe a fabricated address.
 */
export async function fetchClientIp(): Promise<string | null> {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    return null;
  }
  const siteUrl = convexUrl.replace(/\.convex\.cloud$/, '.convex.site');

  try {
    const response = await fetch(`${siteUrl}/stripe/client-ip`, {
      method: 'GET',
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { ip?: string | null };
    return payload.ip?.trim() || null;
  } catch (error) {
    console.error('[headless-onramp] client IP lookup failed', error);
    return null;
  }
}
