import {
  DEFAULT_ONRAMP_NETWORK_ID,
  getDefaultOnrampCurrencyForNetwork,
  getOnrampCurrencyOptionsForNetwork,
  isOnrampCurrencySupportedOnNetwork,
  ONRAMP_CURRENCY_OPTIONS,
  ONRAMP_NETWORK_OPTIONS,
  type OnrampCurrencyOption,
  type OnrampDestinationCurrency,
  type OnrampDestinationNetwork,
  type OnrampNetworkOption,
} from '@/lib/onrampSettings';
import { getPrivyOnrampDestination } from '@/lib/privy/onramp';
import type { DepositMethodId } from '@/lib/stripe/depositMethods';

export function isOnrampDestinationSupportedByProvider(
  providerId: DepositMethodId,
  network: OnrampDestinationNetwork,
  currency: OnrampDestinationCurrency,
): boolean {
  if (!isOnrampCurrencySupportedOnNetwork(network, currency)) {
    return false;
  }
  if (providerId === 'stripe-embedded') {
    return true;
  }
  return getPrivyOnrampDestination({ network, currency }) !== null;
}

export function getOnrampNetworkOptionsForProvider(
  providerId: DepositMethodId,
): OnrampNetworkOption[] {
  return ONRAMP_NETWORK_OPTIONS.filter((network) =>
    ONRAMP_CURRENCY_OPTIONS.some((currency) =>
      isOnrampDestinationSupportedByProvider(
        providerId,
        network.id,
        currency.id,
      ),
    ),
  );
}

export function getOnrampCurrencyOptionsForProviderAndNetwork(
  providerId: DepositMethodId,
  network: OnrampDestinationNetwork,
): OnrampCurrencyOption[] {
  return getOnrampCurrencyOptionsForNetwork(network).filter((currency) =>
    isOnrampDestinationSupportedByProvider(providerId, network, currency.id),
  );
}

export function getDefaultOnrampCurrencyForProviderAndNetwork(
  providerId: DepositMethodId,
  network: OnrampDestinationNetwork,
): OnrampDestinationCurrency {
  const preferred = getDefaultOnrampCurrencyForNetwork(network);
  const options = getOnrampCurrencyOptionsForProviderAndNetwork(
    providerId,
    network,
  );
  if (options.some((option) => option.id === preferred)) {
    return preferred;
  }
  return options[0]?.id ?? preferred;
}

export function coerceOnrampDestinationForProvider(
  providerId: DepositMethodId,
  network: OnrampDestinationNetwork,
  currency: OnrampDestinationCurrency,
): {
  network: OnrampDestinationNetwork;
  currency: OnrampDestinationCurrency;
} {
  const networkOptions = getOnrampNetworkOptionsForProvider(providerId);
  let nextNetwork = network;
  if (!networkOptions.some((option) => option.id === network)) {
    nextNetwork = networkOptions[0]?.id ?? DEFAULT_ONRAMP_NETWORK_ID;
  }

  const currencyOptions = getOnrampCurrencyOptionsForProviderAndNetwork(
    providerId,
    nextNetwork,
  );
  let nextCurrency = currency;
  if (!currencyOptions.some((option) => option.id === currency)) {
    nextCurrency = getDefaultOnrampCurrencyForProviderAndNetwork(
      providerId,
      nextNetwork,
    );
  }

  return { network: nextNetwork, currency: nextCurrency };
}
