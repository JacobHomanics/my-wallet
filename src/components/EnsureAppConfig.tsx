import { useEnsureAppConfig } from '@/hooks/useEnsureAppConfig';

/** Prefetches public app config (tax, gas sponsorship, rewards, cashback). */
export function EnsureAppConfig() {
  useEnsureAppConfig();
  return null;
}
