import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';

/** Common stablecoin symbols (case-insensitive). */
const STABLECOIN_SYMBOLS = new Set([
  'usdc',
  'usdt',
  'dai',
  'usdb',
  'usdbc',
  'usd1',
  'fdusd',
  'tusd',
  'usdp',
  'frax',
  'lusd',
  'gusd',
  'usde',
  'susd',
  'pyusd',
  'eurc',
]);

/**
 * Heuristic stablecoin detection from symbol / name.
 * Good enough for payment strategy ranking until we have richer metadata.
 */
export function isStablecoin(token: OwnedToken): boolean {
  const symbol = token.symbol.trim().toLowerCase();
  if (STABLECOIN_SYMBOLS.has(symbol)) {
    return true;
  }
  // Bridged / wrapped variants like "USDC.e"
  const base = symbol.replace(/\.(e|bridged)$/i, '').replace(/[^a-z0-9]/g, '');
  if (STABLECOIN_SYMBOLS.has(base)) {
    return true;
  }
  if (isNativeTokenAddress(token.tokenAddress)) {
    return false;
  }
  const name = token.name.trim().toLowerCase();
  return (
    name.includes('usd coin') ||
    name.includes('tether') ||
    name.includes('dai stable') ||
    /\bstablecoin\b/.test(name)
  );
}
