/**
 * Stripe publishable key for the embedded Crypto Onramp (client-side only).
 */
export function getStripePublishableKey(): string {
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';
}
