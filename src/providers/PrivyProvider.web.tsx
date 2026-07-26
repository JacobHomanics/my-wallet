import { PrivyProvider as WebPrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';

import { privyConfig } from '@/lib/privy/config/privyConfig.web';
import { privyCredentials } from '@/lib/privy/credentials/privyCredentials';

type Props = {
  children: ReactNode;
};

export function PrivyProvider({ children }: Props) {
  return (
    <WebPrivyProvider
      appId={privyCredentials.appId}
      clientId={privyCredentials.clientId}
      config={privyConfig}
    >
      {children}
    </WebPrivyProvider>
  );
}
