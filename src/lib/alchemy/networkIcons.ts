/** Chain / network icons for token list badges. */

import { APP_NETWORK_DEFINITIONS } from '@/lib/alchemy/networkDefinitions';

const TW_CHAIN = (chain: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/info/logo.png`;

const NETWORK_ICONS: Record<string, string> = Object.fromEntries(
  APP_NETWORK_DEFINITIONS.flatMap((def) =>
    def.iconChain ? [[def.id, TW_CHAIN(def.iconChain)] as const] : [],
  ),
);

export function getNetworkIconUrl(network: string): string | null {
  return NETWORK_ICONS[network] ?? null;
}
