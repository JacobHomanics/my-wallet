/**
 * Alchemy Portfolio metadata often returns `logo: null` (or a broken URL) for
 * L2 natives and some ERC-20s. Prefer known CDN logos for major assets.
 */

/** Trust Wallet assets CDN — reliable PNG logos. */
const TW = {
  eth: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  usdc: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  pol: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  avax: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanche/info/logo.png',
  sol: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
} as const;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
/** Common “native token” sentinel used by some portfolio APIs. */
const NATIVE_SENTINEL = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
/** Canonical WETH on OP-stack L2s (Base / Optimism). */
const OP_STACK_WETH = '0x4200000000000000000000000000000000000006';

/** Native gas token logo by Alchemy network slug. */
const NATIVE_LOGOS: Record<string, string> = {
  'eth-mainnet': TW.eth,
  'base-mainnet': TW.eth,
  'arb-mainnet': TW.eth,
  'opt-mainnet': TW.eth,
  'polygon-mainnet': TW.pol,
  'avax-mainnet': TW.avax,
  'solana-mainnet': TW.sol,
};

/**
 * Well-known token logos keyed by `network:lowercaseAddress`.
 */
const TOKEN_LOGOS: Record<string, string> = {
  // Ethereum USDC
  'eth-mainnet:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': TW.usdc,
  // Base native USDC + bridged USDbC + gas-payment stables + WETH
  'base-mainnet:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': TW.usdc,
  'base-mainnet:0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': TW.usdc,
  'base-mainnet:0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42': TW.usdc,
  'base-mainnet:0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': TW.usdc,
  [`base-mainnet:${OP_STACK_WETH}`]: TW.eth,
  // Arbitrum USDC + WETH
  'arb-mainnet:0xaf88d065e77c8cc2239327c5edb3a432268e5831': TW.usdc,
  'arb-mainnet:0x82af49447d8a07e3bd95bd0d56f35241523fbab1': TW.eth,
  // Optimism USDC + WETH
  'opt-mainnet:0x0b2c639c533813f4aa9d7837caf62653d097ff85': TW.usdc,
  [`opt-mainnet:${OP_STACK_WETH}`]: TW.eth,
  // Polygon native USDC
  'polygon-mainnet:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': TW.usdc,
  // Avalanche native USDC + bridged WETH.e
  'avax-mainnet:0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': TW.usdc,
  'avax-mainnet:0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': TW.eth,
};

const SYMBOL_LOGOS: Record<string, string> = {
  eth: TW.eth,
  weth: TW.eth,
  usdc: TW.usdc,
  usdbc: TW.usdc,
  pol: TW.pol,
  matic: TW.pol,
  avax: TW.avax,
  wavax: TW.avax,
  sol: TW.sol,
};

function tokenLogoKey(network: string, tokenAddress: string) {
  return `${network}:${tokenAddress.toLowerCase()}`;
}

export function isNativeTokenAddress(
  tokenAddress: string | null | undefined,
): boolean {
  if (tokenAddress == null) {
    return true;
  }
  const normalized = tokenAddress.trim().toLowerCase();
  return (
    normalized === '' ||
    normalized === ZERO_ADDRESS ||
    normalized === NATIVE_SENTINEL
  );
}

/**
 * Known logos first (Alchemy often omits or breaks L2 native logos), then API.
 */
export function resolveTokenLogoUrl(params: {
  network: string;
  tokenAddress: string | null;
  symbol?: string;
  alchemyLogo?: string | null | undefined;
}): string | null {
  if (isNativeTokenAddress(params.tokenAddress)) {
    return (
      NATIVE_LOGOS[params.network] ??
      logoForSymbol(params.symbol) ??
      trimUrl(params.alchemyLogo)
    );
  }

  const byAddress =
    TOKEN_LOGOS[tokenLogoKey(params.network, params.tokenAddress!)];
  if (byAddress) {
    return byAddress;
  }

  const bySymbol = logoForSymbol(params.symbol);
  if (bySymbol) {
    return bySymbol;
  }

  return trimUrl(params.alchemyLogo);
}

function logoForSymbol(symbol: string | undefined): string | null {
  if (!symbol) {
    return null;
  }
  return SYMBOL_LOGOS[symbol.trim().toLowerCase()] ?? null;
}

export function getTokenSymbolLogoUrl(symbol: string | undefined): string | null {
  return logoForSymbol(symbol);
}

function trimUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
