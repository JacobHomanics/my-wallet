import { useCallback, useSyncExternalStore } from 'react';

type DefaultCashboxNetworkListener = () => void;

let defaultCashboxNetwork = true;
const listeners = new Set<DefaultCashboxNetworkListener>();

function subscribe(listener: DefaultCashboxNetworkListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return defaultCashboxNetwork;
}

/** Whether new sends default to ZitiCashbox Network (backend broadcast). */
export function getDefaultCashboxNetwork(): boolean {
  return getSnapshot();
}

function setDefaultCashboxNetworkValue(enabled: boolean): void {
  if (enabled === defaultCashboxNetwork) {
    return;
  }
  defaultCashboxNetwork = enabled;
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * App default for routing sends through ZitiCashbox Network. Send flow may override.
 */
export function useDefaultCashboxNetwork(): {
  defaultCashboxNetwork: boolean;
  setDefaultCashboxNetwork: (enabled: boolean) => void;
} {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setDefaultCashboxNetwork = useCallback((value: boolean) => {
    setDefaultCashboxNetworkValue(value);
  }, []);

  return {
    defaultCashboxNetwork: enabled,
    setDefaultCashboxNetwork,
  };
}
