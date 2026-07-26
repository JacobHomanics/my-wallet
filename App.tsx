import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
import * as WebBrowser from 'expo-web-browser';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EnsureEmbeddedWallets } from '@/components/EnsureEmbeddedWallets';
import { AuthFlowProvider } from '@/lib/privy/context/AuthFlowContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { PrivyProvider } from '@/providers/PrivyProvider';

// Required by Privy / wallet crypto polyfills — keep after get-random-values.
global.Buffer = Buffer;

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <SafeAreaProvider>
      <PrivyProvider>
        <AuthFlowProvider>
          <EnsureEmbeddedWallets />
          <RootNavigator />
        </AuthFlowProvider>
      </PrivyProvider>
    </SafeAreaProvider>
  );
}
