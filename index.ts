// Polyfills first (Privy + Solana) — must precede app imports.
import './polyfills';

import 'react-native-gesture-handler';
import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';

import App from './App';

if (__DEV__ && typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    const isStyledDynamicWarning =
      first.includes('has been created dynamically') &&
      first.includes('styled-components');
    const isPointerEventsDeprecation =
      first.includes('props.pointerEvents is deprecated');

    if (isStyledDynamicWarning || isPointerEventsDeprecation) {
      return;
    }

    originalWarn(...args);
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
