import { useCallback } from 'react';
import { useIdentityToken, usePrivy } from '@privy-io/expo';

/**
 * JWT used for Privy Wallet API `user_jwts` authorization (native).
 *
 * Prefers the identity token — access tokens are rejected by
 * `/v1/wallets/authenticate` with "Invalid JWT token provided".
 * Enable "Return user data in an identity token" in the Privy Dashboard.
 */
export function usePrivyAccessToken(): {
  ready: boolean;
  getAccessToken: () => Promise<string>;
} {
  const { isReady, user } = usePrivy();
  const { getIdentityToken } = useIdentityToken();

  const getToken = useCallback(async () => {
    const identityToken = await getIdentityToken();
    if (identityToken) {
      return identityToken;
    }

    throw new Error(
      'Missing Privy identity token. Enable "Return user data in an identity token" in the Privy Dashboard (User management → Authentication → Advanced), then log in again.',
    );
  }, [getIdentityToken]);

  return {
    ready: isReady && !!user,
    getAccessToken: getToken,
  };
}
