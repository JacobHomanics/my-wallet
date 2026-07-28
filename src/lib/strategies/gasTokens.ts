import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';

/** Native chain gas tokens (ETH, SOL, POL, etc.). */
export function isGasToken(token: OwnedToken): boolean {
  return isNativeTokenAddress(token.tokenAddress);
}
