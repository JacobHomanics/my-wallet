import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
import * as WebBrowser from 'expo-web-browser';

import { AuthFlowProvider } from '@/lib/privy/context/AuthFlowContext';
import { EnsureEmbeddedWallets } from '@/components/EnsureEmbeddedWallets';
import { RootNavigator } from '@/navigation/RootNavigator';
import { PrivyProvider } from '@/providers/PrivyProvider';

// Required by Privy / wallet crypto polyfills — keep after get-random-values.
global.Buffer = Buffer;

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <PrivyProvider>
      <AuthFlowProvider>
        <EnsureEmbeddedWallets />
        <RootNavigator />
      </AuthFlowProvider>
    </PrivyProvider>
  );
}
