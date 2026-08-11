import { getNetworkIconUrl } from '@/lib/alchemy/networkIcons';
import { getTokenSymbolLogoUrl } from '@/lib/alchemy/tokenLogos';

export type OnrampDestinationNetwork = 'base' | 'ethereum' | 'avalanche';
export type OnrampDestinationCurrency = 'eth' | 'usdc' | 'avax';

export type OnrampNetworkOption = {
  id: OnrampDestinationNetwork;
  label: string;
  description: string;
  iconUrl: string | null;
};

export type OnrampCurrencyOption = {
  id: OnrampDestinationCurrency;
  label: string;
  description: string;
  networks: readonly OnrampDestinationNetwork[];
  iconUrl: string | null;
};

function networkIconUrl(network: OnrampDestinationNetwork): string | null {
  switch (network) {
    case 'base':
      return getNetworkIconUrl('base-mainnet');
    case 'ethereum':
      return getNetworkIconUrl('eth-mainnet');
    case 'avalanche':
      return getNetworkIconUrl('avax-mainnet');
  }
}

export const ONRAMP_NETWORK_OPTIONS = [
  {
    id: 'base',
    label: 'Base',
    description: 'Low-fee Ethereum L2.',
    iconUrl: networkIconUrl('base'),
  },
  {
    id: 'ethereum',
    label: 'Ethereum',
    description: 'Main Ethereum network.',
    iconUrl: networkIconUrl('ethereum'),
  },
  {
    id: 'avalanche',
    label: 'Avalanche',
    description: 'Avalanche C-Chain.',
    iconUrl: networkIconUrl('avalanche'),
  },
] as const satisfies readonly OnrampNetworkOption[];

export const ONRAMP_CURRENCY_OPTIONS = [
  {
    id: 'eth',
    label: 'ETH',
    description: 'Ether.',
    networks: ['base', 'ethereum'],
    iconUrl: getTokenSymbolLogoUrl('eth'),
  },
  {
    id: 'usdc',
    label: 'USDC',
    description: 'USD Coin.',
    networks: ['base', 'ethereum', 'avalanche'],
    iconUrl: getTokenSymbolLogoUrl('usdc'),
  },
  {
    id: 'avax',
    label: 'AVAX',
    description: 'Avalanche native token.',
    networks: ['avalanche'],
    iconUrl: getTokenSymbolLogoUrl('avax'),
  },
] as const satisfies readonly OnrampCurrencyOption[];

export const DEFAULT_ONRAMP_NETWORK_ID: OnrampDestinationNetwork = 'ethereum';
export const DEFAULT_ONRAMP_CURRENCY_ID: OnrampDestinationCurrency = 'eth';

export function getOnrampNetworkOption(
  id: OnrampDestinationNetwork,
): OnrampNetworkOption | null {
  return ONRAMP_NETWORK_OPTIONS.find((option) => option.id === id) ?? null;
}

export function getOnrampCurrencyOption(
  id: OnrampDestinationCurrency,
): OnrampCurrencyOption | null {
  return ONRAMP_CURRENCY_OPTIONS.find((option) => option.id === id) ?? null;
}

export function getOnrampCurrencyOptionsForNetwork(
  network: OnrampDestinationNetwork,
): OnrampCurrencyOption[] {
  return ONRAMP_CURRENCY_OPTIONS.filter((option) =>
    (option.networks as readonly OnrampDestinationNetwork[]).includes(network),
  );
}

export function isOnrampCurrencySupportedOnNetwork(
  network: OnrampDestinationNetwork,
  currency: OnrampDestinationCurrency,
): boolean {
  return getOnrampCurrencyOptionsForNetwork(network).some(
    (option) => option.id === currency,
  );
}

export function getDefaultOnrampCurrencyForNetwork(
  network: OnrampDestinationNetwork,
): OnrampDestinationCurrency {
  switch (network) {
    case 'ethereum':
      return 'eth';
    case 'base':
      return 'eth';
    case 'avalanche':
      return 'avax';
  }
}

export function formatOnrampDestinationLabel(params: {
  network: OnrampDestinationNetwork;
  currency: OnrampDestinationCurrency;
}): string {
  const network = getOnrampNetworkOption(params.network)?.label ?? params.network;
  const currency =
    getOnrampCurrencyOption(params.currency)?.label ?? params.currency.toUpperCase();
  return `${network} ${currency}`;
}
