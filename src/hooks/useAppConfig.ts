import { useConvex } from 'convex/react';
import { useEffect, useState } from 'react';

import { api } from '../../convex/_generated/api';
import type { PublicAppConfig } from '@/lib/appConfig.types';

export type UseAppConfigResult = {
  config: PublicAppConfig | null;
  loading: boolean;
  ready: boolean;
};

let cachedConfig: PublicAppConfig | null = null;
let inflightConfig: Promise<PublicAppConfig> | null = null;

function loadAppConfig(
  convex: ReturnType<typeof useConvex>,
): Promise<PublicAppConfig> {
  if (cachedConfig != null) {
    return Promise.resolve(cachedConfig);
  }
  if (inflightConfig != null) {
    return inflightConfig;
  }

  inflightConfig = convex.query(api.appConfig.getPublic, {}).then((result) => {
    cachedConfig = result;
    inflightConfig = null;
    return result;
  });

  return inflightConfig;
}

/** Session cache for non-hook callers (e.g. send payment builders). */
export function getCachedAppConfig(): PublicAppConfig | null {
  return cachedConfig;
}

/**
 * Rewards, cashback, tax, and gas sponsorship from Convex (`convex/config/app.config.ts`).
 * Fetched once per app session (not a live subscription).
 */
export function useAppConfig(): UseAppConfigResult {
  const convex = useConvex();
  const [config, setConfig] = useState<PublicAppConfig | null>(cachedConfig);
  const [loading, setLoading] = useState(cachedConfig == null);

  useEffect(() => {
    if (cachedConfig != null) {
      return;
    }

    let cancelled = false;

    void loadAppConfig(convex)
      .then((result) => {
        if (!cancelled) {
          setConfig(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [convex]);

  return {
    config,
    loading,
    ready: config != null,
  };
}
