import { useAppConfig } from '@/hooks/useAppConfig';

/** Prefetches public app config once per session at app startup. */
export function useEnsureAppConfig(): void {
  useAppConfig();
}
