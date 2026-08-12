import { useCallback, useSyncExternalStore } from 'react';

import {
  DEFAULT_DEPOSIT_METHOD_ID,
  getDepositMethodOption,
  DEPOSIT_METHODS,
  type DepositMethodId,
  type DepositMethodOption,
} from '@/lib/stripe/depositMethods';
import {
  coerceOnrampDestinationForProvider,
  getDefaultOnrampCurrencyForProviderAndNetwork,
  getOnrampCurrencyOptionsForProviderAndNetwork,
  getOnrampNetworkOptionsForProvider,
  isOnrampDestinationSupportedByProvider,
} from '@/lib/onrampProviderSupport';
import {
  DEFAULT_ONRAMP_CURRENCY_ID,
  DEFAULT_ONRAMP_NETWORK_ID,
  formatOnrampDestinationLabel,
  getOnrampCurrencyOption,
  getOnrampNetworkOption,
  type OnrampCurrencyOption,
  type OnrampDestinationCurrency,
  type OnrampDestinationNetwork,
  type OnrampNetworkOption,
} from '@/lib/onrampSettings';

type OnrampSettingsListener = () => void;

const initialOnrampDestination = coerceOnrampDestinationForProvider(
  DEFAULT_DEPOSIT_METHOD_ID,
  DEFAULT_ONRAMP_NETWORK_ID,
  DEFAULT_ONRAMP_CURRENCY_ID,
);

let selectedOnrampNetworkId: OnrampDestinationNetwork =
  initialOnrampDestination.network;
let selectedOnrampCurrencyId: OnrampDestinationCurrency =
  initialOnrampDestination.currency;
let selectedDepositMethodId: DepositMethodId = DEFAULT_DEPOSIT_METHOD_ID;
const listeners = new Set<OnrampSettingsListener>();

function subscribe(listener: OnrampSettingsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): `${OnrampDestinationNetwork}|${OnrampDestinationCurrency}|${DepositMethodId}` {
  return `${selectedOnrampNetworkId}|${selectedOnrampCurrencyId}|${selectedDepositMethodId}`;
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
  selectedOnrampCurrencyId = getDefaultOnrampCurrencyForProviderAndNetwork(
    selectedDepositMethodId,
    id,
  );
  emitChange();
}

function setSelectedOnrampCurrencyId(id: OnrampDestinationCurrency): void {
  if (
    id === selectedOnrampCurrencyId ||
    !isOnrampDestinationSupportedByProvider(
      selectedDepositMethodId,
      selectedOnrampNetworkId,
      id,
    )
  ) {
    return;
  }
  selectedOnrampCurrencyId = id;
  emitChange();
}

function setSelectedDepositMethod(id: DepositMethodId): void {
  if (id === selectedDepositMethodId) {
    return;
  }
  selectedDepositMethodId = id;
  const coerced = coerceOnrampDestinationForProvider(
    id,
    selectedOnrampNetworkId,
    selectedOnrampCurrencyId,
  );
  selectedOnrampNetworkId = coerced.network;
  selectedOnrampCurrencyId = coerced.currency;
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
  providerOptions: readonly DepositMethodOption[];
  selectedProviderId: DepositMethodId;
  selectedProvider: DepositMethodOption;
  setOnrampNetwork: (id: OnrampDestinationNetwork) => void;
  setOnrampCurrency: (id: OnrampDestinationCurrency) => void;
  setOnrampProvider: (id: DepositMethodId) => void;
} {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
  const [networkId, currencyId, providerId] = snapshot.split('|') as [
    OnrampDestinationNetwork,
    OnrampDestinationCurrency,
    DepositMethodId,
  ];

  const setOnrampNetwork = useCallback((id: OnrampDestinationNetwork) => {
    setSelectedOnrampNetworkId(id);
  }, []);

  const setOnrampCurrency = useCallback((id: OnrampDestinationCurrency) => {
    setSelectedOnrampCurrencyId(id);
  }, []);

  const setOnrampProvider = useCallback((id: DepositMethodId) => {
    setSelectedDepositMethod(id);
  }, []);

  const selectedNetwork =
    getOnrampNetworkOption(networkId) ??
    getOnrampNetworkOption(DEFAULT_ONRAMP_NETWORK_ID)!;
  const selectedCurrency =
    getOnrampCurrencyOption(currencyId) ??
    getOnrampCurrencyOption(
      getDefaultOnrampCurrencyForProviderAndNetwork(
        providerId,
        selectedNetwork.id,
      ),
    )!;
  const networkOptions = getOnrampNetworkOptionsForProvider(providerId);
  const currencyOptions = getOnrampCurrencyOptionsForProviderAndNetwork(
    providerId,
    selectedNetwork.id,
  );
  const selectedProvider =
    getDepositMethodOption(providerId) ??
    getDepositMethodOption(DEFAULT_DEPOSIT_METHOD_ID)!;

  return {
    networkOptions,
    currencyOptions,
    selectedNetworkId: selectedNetwork.id,
    selectedNetwork,
    selectedCurrencyId: selectedCurrency.id,
    selectedCurrency,
    selectedDestinationLabel: formatOnrampDestinationLabel({
      network: selectedNetwork.id,
      currency: selectedCurrency.id,
    }),
    providerOptions: DEPOSIT_METHODS,
    selectedProviderId: selectedProvider.id,
    selectedProvider,
    setOnrampNetwork,
    setOnrampCurrency,
    setOnrampProvider,
  };
}
