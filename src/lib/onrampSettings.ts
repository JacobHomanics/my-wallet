export type OnrampDestinationId =
  | 'base-eth'
  | 'base-usdc'
  | 'ethereum-eth'
  | 'ethereum-usdc'
  | 'avalanche-avax'
  | 'avalanche-usdc';

export type OnrampDestinationNetwork = 'base' | 'ethereum' | 'avalanche';
export type OnrampDestinationCurrency = 'eth' | 'usdc' | 'avax';

export type OnrampDestinationOption = {
  id: OnrampDestinationId;
  label: string;
  description: string;
  network: OnrampDestinationNetwork;
  currency: OnrampDestinationCurrency;
};

export const ONRAMP_DESTINATION_OPTIONS = [
  {
    id: 'base-eth',
    label: 'Base ETH',
    description: 'Buy ETH on Base.',
    network: 'base',
    currency: 'eth',
  },
  {
    id: 'base-usdc',
    label: 'Base USDC',
    description: 'Buy USDC on Base.',
    network: 'base',
    currency: 'usdc',
  },
  {
    id: 'ethereum-eth',
    label: 'Ethereum ETH',
    description: 'Buy ETH on Ethereum.',
    network: 'ethereum',
    currency: 'eth',
  },
  {
    id: 'ethereum-usdc',
    label: 'Ethereum USDC',
    description: 'Buy USDC on Ethereum.',
    network: 'ethereum',
    currency: 'usdc',
  },
  {
    id: 'avalanche-avax',
    label: 'Avalanche AVAX',
    description: 'Buy AVAX on Avalanche.',
    network: 'avalanche',
    currency: 'avax',
  },
  {
    id: 'avalanche-usdc',
    label: 'Avalanche USDC',
    description: 'Buy USDC on Avalanche.',
    network: 'avalanche',
    currency: 'usdc',
  },
] as const satisfies readonly OnrampDestinationOption[];

export const DEFAULT_ONRAMP_DESTINATION_ID: OnrampDestinationId = 'base-eth';

export function getOnrampDestinationOption(
  id: OnrampDestinationId,
): OnrampDestinationOption | null {
  return ONRAMP_DESTINATION_OPTIONS.find((option) => option.id === id) ?? null;
}
