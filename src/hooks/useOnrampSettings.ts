import { useCallback, useSyncExternalStore } from 'react';

import {
  DEFAULT_ONRAMP_CURRENCY_ID,
  DEFAULT_ONRAMP_NETWORK_ID,
  formatOnrampDestinationLabel,
  getDefaultOnrampCurrencyForNetwork,
  getOnrampCurrencyOption,
  getOnrampCurrencyOptionsForNetwork,
  getOnrampNetworkOption,
  isOnrampCurrencySupportedOnNetwork,
  ONRAMP_NETWORK_OPTIONS,
  type OnrampCurrencyOption,
  type OnrampDestinationCurrency,
  type OnrampDestinationNetwork,
  type OnrampNetworkOption,
} from '@/lib/onrampSettings';

type OnrampSettingsListener = () => void;

let selectedOnrampNetworkId: OnrampDestinationNetwork = DEFAULT_ONRAMP_NETWORK_ID;
let selectedOnrampCurrencyId: OnrampDestinationCurrency =
  DEFAULT_ONRAMP_CURRENCY_ID;
const listeners = new Set<OnrampSettingsListener>();

function subscribe(listener: OnrampSettingsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): `${OnrampDestinationNetwork}|${OnrampDestinationCurrency}` {
  return `${selectedOnrampNetworkId}|${selectedOnrampCurrencyId}`;
}

function emitChange(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function setSelectedOnrampNetworkId(id: OnrampDestinationNetwork): void {
  if (id === selectedOnrampNetworkId) {
    return;
  }
  selectedOnrampNetworkId = id;
  selectedOnrampCurrencyId = getDefaultOnrampCurrencyForNetwork(id);
  emitChange();
}

function setSelectedOnrampCurrencyId(id: OnrampDestinationCurrency): void {
  if (
    id === selectedOnrampCurrencyId ||
    !isOnrampCurrencySupportedOnNetwork(selectedOnrampNetworkId, id)
  ) {
    return;
  }
  selectedOnrampCurrencyId = id;
  emitChange();
}

/**
 * Default onramp destination used to preselect the Stripe widget.
 */
export function useOnrampSettings(): {
  networkOptions: readonly OnrampNetworkOption[];
  currencyOptions: readonly OnrampCurrencyOption[];
  selectedNetworkId: OnrampDestinationNetwork;
  selectedNetwork: OnrampNetworkOption;
  selectedCurrencyId: OnrampDestinationCurrency;
  selectedCurrency: OnrampCurrencyOption;
  selectedDestinationLabel: string;
  setOnrampNetwork: (id: OnrampDestinationNetwork) => void;
  setOnrampCurrency: (id: OnrampDestinationCurrency) => void;
} {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
  const [networkId, currencyId] = snapshot.split('|') as [
    OnrampDestinationNetwork,
    OnrampDestinationCurrency,
  ];

  const setOnrampNetwork = useCallback((id: OnrampDestinationNetwork) => {
    setSelectedOnrampNetworkId(id);
  }, []);

  const setOnrampCurrency = useCallback((id: OnrampDestinationCurrency) => {
    setSelectedOnrampCurrencyId(id);
  }, []);

  const selectedNetwork =
    getOnrampNetworkOption(networkId) ??
    getOnrampNetworkOption(DEFAULT_ONRAMP_NETWORK_ID)!;
  const selectedCurrency =
    getOnrampCurrencyOption(currencyId) ??
    getOnrampCurrencyOption(
      getDefaultOnrampCurrencyForNetwork(selectedNetwork.id),
    )!;
  const currencyOptions = getOnrampCurrencyOptionsForNetwork(selectedNetwork.id);

  return {
    networkOptions: ONRAMP_NETWORK_OPTIONS,
    currencyOptions,
    selectedNetworkId: selectedNetwork.id,
    selectedNetwork,
    selectedCurrencyId: selectedCurrency.id,
    selectedCurrency,
    selectedDestinationLabel: formatOnrampDestinationLabel({
      network: selectedNetwork.id,
      currency: selectedCurrency.id,
    }),
    setOnrampNetwork,
    setOnrampCurrency,
  };
}
