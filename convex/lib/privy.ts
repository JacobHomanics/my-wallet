import { PrivyClient } from "@privy-io/node";
import type { AuthorizationContext } from "@privy-io/node";

export function getPrivyClient(): PrivyClient {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Missing PRIVY_APP_ID or PRIVY_APP_SECRET");
  }
  return new PrivyClient({ appId, appSecret });
}

/**
 * Authorization context for server-driven wallet sends.
 * Private key: Convex env `PRIVY_AUTHORIZATION_PRIVATE_KEY`.
 */
export function getAuthorizationContext(): AuthorizationContext {
  const authorizationPrivateKey =
    process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY?.trim();
  if (!authorizationPrivateKey) {
    throw new Error("Missing PRIVY_AUTHORIZATION_PRIVATE_KEY");
  }
  return {
    authorization_private_keys: [authorizationPrivateKey],
  };
}
