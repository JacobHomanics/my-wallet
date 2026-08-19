import { useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type { PublicAppConfig } from '@/lib/appConfig.types';

export type UseAppConfigResult = {
  config: PublicAppConfig | null;
  loading: boolean;
  ready: boolean;
};

/** Rewards + cashback settings from Convex (`convex/config/app.config.ts`). */
export function useAppConfig(): UseAppConfigResult {
  const config = useQuery(api.appConfig.getPublic);

  return {
    config: config ?? null,
    loading: config === undefined,
    ready: config != null,
  };
}
