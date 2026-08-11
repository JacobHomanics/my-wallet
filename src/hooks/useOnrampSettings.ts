import { useCallback, useSyncExternalStore } from 'react';

import {
  DEFAULT_ONRAMP_DESTINATION_ID,
  getOnrampDestinationOption,
  ONRAMP_DESTINATION_OPTIONS,
  type OnrampDestinationId,
  type OnrampDestinationOption,
} from '@/lib/onrampSettings';

type OnrampSettingsListener = () => void;

let selectedOnrampDestinationId: OnrampDestinationId =
  DEFAULT_ONRAMP_DESTINATION_ID;
const listeners = new Set<OnrampSettingsListener>();

function subscribe(listener: OnrampSettingsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): OnrampDestinationId {
  return selectedOnrampDestinationId;
}

function setSelectedOnrampDestinationId(id: OnrampDestinationId): void {
  if (id === selectedOnrampDestinationId) {
    return;
  }
  selectedOnrampDestinationId = id;
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * Default onramp destination used to preselect the Stripe widget.
 */
export function useOnrampSettings(): {
  options: readonly OnrampDestinationOption[];
  selectedDestinationId: OnrampDestinationId;
  selectedDestination: OnrampDestinationOption;
  setOnrampDestination: (id: OnrampDestinationId) => void;
} {
  const selectedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const setOnrampDestination = useCallback((id: OnrampDestinationId) => {
    setSelectedOnrampDestinationId(id);
  }, []);

  const selectedDestination =
    getOnrampDestinationOption(selectedId) ??
    getOnrampDestinationOption(DEFAULT_ONRAMP_DESTINATION_ID)!;

  return {
    options: ONRAMP_DESTINATION_OPTIONS,
    selectedDestinationId: selectedDestination.id,
    selectedDestination,
    setOnrampDestination,
  };
}
