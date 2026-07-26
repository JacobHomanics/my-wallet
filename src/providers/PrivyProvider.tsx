import { PrivyProvider as ExpoPrivyProvider } from '@privy-io/expo';
import type { ReactNode } from 'react';

import { privyCredentials } from '@/lib/privy/credentials/privyCredentials';

type Props = {
  children: ReactNode;
};

export function PrivyProvider({ children }: Props) {
  return (
    <ExpoPrivyProvider
      appId={privyCredentials.appId}
      clientId={privyCredentials.clientId}
    >
      {children}
    </ExpoPrivyProvider>
  );
}
