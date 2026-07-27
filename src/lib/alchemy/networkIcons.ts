/** Chain / network icons for token list badges. */

const TW_CHAIN = (chain: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/info/logo.png`;

const NETWORK_ICONS: Record<string, string> = {
  'eth-mainnet': TW_CHAIN('ethereum'),
  'base-mainnet': TW_CHAIN('base'),
  'arb-mainnet': TW_CHAIN('arbitrum'),
  'opt-mainnet': TW_CHAIN('optimism'),
  'polygon-mainnet': TW_CHAIN('polygon'),
  'solana-mainnet': TW_CHAIN('solana'),
};

export function getNetworkIconUrl(network: string): string | null {
  return NETWORK_ICONS[network] ?? null;
}
