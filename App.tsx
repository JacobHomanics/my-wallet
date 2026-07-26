import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';

import { RootNavigator } from '@/navigation/RootNavigator';
import { PrivyProvider } from '@/providers/PrivyProvider';

// Required by Privy / wallet crypto polyfills — keep after get-random-values.
global.Buffer = Buffer;

export default function App() {
  return (
    <PrivyProvider>
      <RootNavigator />
    </PrivyProvider>
  );
}
