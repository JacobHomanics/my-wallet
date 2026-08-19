import { useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';

/**
 * Wallets, backend config, and token settings for the hidden `/config` screen.
 */
export function useConfigScreen() {
  const data = useQuery(api.appConfig.getConfigScreen);

  return {
    data: data ?? null,
    loading: data === undefined,
  };
}
