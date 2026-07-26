import { PrivyProvider as ExpoPrivyProvider } from '@privy-io/expo';
import { PrivyElements } from '@privy-io/expo/ui';
import type { ReactNode } from 'react';

import { privyConfig } from '@/lib/privy/config/privyConfig.native';
import { privyCredentials } from '@/lib/privy/credentials/privyCredentials';

type Props = {
  children: ReactNode;
};

export function PrivyProvider({ children }: Props) {
  return (
    <ExpoPrivyProvider
      appId={privyCredentials.appId}
      clientId={privyCredentials.clientId}
      config={privyConfig}
    >
      <PrivyElements />
      {children}
    </ExpoPrivyProvider>
  );
}
