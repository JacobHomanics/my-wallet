import { isNativeTokenAddress } from "./networks";

/** Base mainnet tokens that can pay network fees (Coinbase Smart Wallet). */
const BASE_GAS_PAYMENT_TOKEN_ADDRESSES = new Set([
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC
  "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42", // EURC
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2", // USDT
]);

export function shouldDeferLegForGasPayment(
  network: string,
  tokenAddress: string | null | undefined,
): boolean {
  if (isNativeTokenAddress(tokenAddress)) {
    return true;
  }
  if (network !== "base-mainnet" || tokenAddress == null) {
    return false;
  }
  return BASE_GAS_PAYMENT_TOKEN_ADDRESSES.has(
    tokenAddress.trim().toLowerCase(),
  );
}
