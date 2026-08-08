import { useCallback } from 'react';
import {
  getIdentityToken,
  useIdentityToken,
  usePrivy,
} from '@privy-io/react-auth';

/**
 * JWT used for Privy Wallet API `user_jwts` authorization (web).
 *
 * Prefers the identity token — access tokens are rejected by
 * `/v1/wallets/authenticate` with "Invalid JWT token provided".
 * Enable "Return user data in an identity token" in the Privy Dashboard.
 */
export function usePrivyAccessToken(): {
  ready: boolean;
  getAccessToken: () => Promise<string>;
} {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { identityToken } = useIdentityToken();

  const getToken = useCallback(async () => {
    if (identityToken) {
      return identityToken;
    }

    // Refresh session; identity token may populate after access-token refresh.
    await getAccessToken();
    const refreshed = await getIdentityToken();
    if (refreshed) {
      return refreshed;
    }

    throw new Error(
      'Missing Privy identity token. Enable "Return user data in an identity token" in the Privy Dashboard (User management → Authentication → Advanced), then log in again.',
    );
  }, [getAccessToken, identityToken]);

  return {
    ready: ready && authenticated,
    getAccessToken: getToken,
  };
}
