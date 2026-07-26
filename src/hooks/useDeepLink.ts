import * as Linking from 'expo-linking';

import { parseAppURL } from '@/navigation/linking';

export function useDeepLink() {
  const url = Linking.useLinkingURL();
  const parsed = url ? parseAppURL(url) : null;

  return {
    url,
    path: parsed?.path ?? null,
    hostname: parsed?.hostname ?? null,
    queryParams: parsed?.queryParams ?? null,
  };
}
