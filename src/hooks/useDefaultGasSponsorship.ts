import { useCallback, useSyncExternalStore } from 'react';

type DefaultGasSponsorshipListener = () => void;

let defaultGasSponsorship = true;
const listeners = new Set<DefaultGasSponsorshipListener>();

function subscribe(listener: DefaultGasSponsorshipListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return defaultGasSponsorship;
}

export function getDefaultGasSponsorship(): boolean {
  return getSnapshot();
}

function setDefaultGasSponsorshipValue(enabled: boolean): void {
  if (enabled === defaultGasSponsorship) {
    return;
  }
  defaultGasSponsorship = enabled;
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * User default for gas sponsorship (Send settings). Only applies when the
 * developer enabled gas sponsorship in `appConfig`.
 */
export function useDefaultGasSponsorship(): {
  defaultGasSponsorship: boolean;
  setDefaultGasSponsorship: (enabled: boolean) => void;
} {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setDefaultGasSponsorship = useCallback((value: boolean) => {
    setDefaultGasSponsorshipValue(value);
  }, []);

  return {
    defaultGasSponsorship: enabled,
    setDefaultGasSponsorship,
  };
}
