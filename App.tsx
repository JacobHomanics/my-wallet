import * as WebBrowser from 'expo-web-browser';
import { Analytics } from '@vercel/analytics/react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EnsureAppConfig } from '@/components/EnsureAppConfig';
import { EnsureConvexUser } from '@/components/EnsureConvexUser';
import { EnsureEmbeddedWallets } from '@/components/EnsureEmbeddedWallets';
import { AuthFlowProvider } from '@/lib/privy/context/AuthFlowContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ConvexProvider } from '@/providers/ConvexProvider';
import { PrivyProvider } from '@/providers/PrivyProvider';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <SafeAreaProvider>
      <ConvexProvider>
        <PrivyProvider>
          <AuthFlowProvider>
            <EnsureEmbeddedWallets />
            <EnsureAppConfig />
            <EnsureConvexUser />
            <RootNavigator />
          </AuthFlowProvider>
        </PrivyProvider>
      </ConvexProvider>
      {Platform.OS === 'web' ? <Analytics /> : null}
    </SafeAreaProvider>
  );
}
