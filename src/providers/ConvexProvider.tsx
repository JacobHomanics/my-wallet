import { ConvexProvider as ConvexReactProvider, ConvexReactClient } from 'convex/react';
import type { ReactNode } from 'react';

import { getConvexUrl } from '@/lib/convex/convexCredentials';

type Props = {
  children: ReactNode;
};

const convexUrl = getConvexUrl();
if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL');
}

const convexClient = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: Props) {
  return (
    <ConvexReactProvider client={convexClient}>{children}</ConvexReactProvider>
  );
}
