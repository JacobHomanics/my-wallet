import { isNativeTokenAddress } from "./networks";

/** Native gas legs broadcast last so fee headroom remains for earlier legs. */
export function shouldDeferLegForGasPayment(
  _network: string,
  tokenAddress: string | null | undefined,
): boolean {
  return isNativeTokenAddress(tokenAddress);
}
