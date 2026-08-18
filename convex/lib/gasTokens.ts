import { isNativeTokenAddress } from "./networks";

/** Base mainnet tokens Privy can debit for gas when sending the same token. */
const BASE_GAS_PAYMENT_TOKEN_ADDRESSES: Readonly<Record<string, string>> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "usdc",
  "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42": "eurc",
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "usdt",
};

const PRIVY_CHAIN_BY_NETWORK: Readonly<Record<string, string>> = {
  "base-mainnet": "base",
};

/** Native gas legs broadcast last so fee headroom remains for earlier legs. */
export function shouldDeferLegForGasPayment(
  network: string,
  tokenAddress: string | null | undefined,
): boolean {
  return isNativeTokenAddress(tokenAddress);
}

/**
 * Privy "user pays" gas only works via the Transfer API when the gas token
 * matches the asset being sent (e.g. Base USDC → USDC transfer).
 */
export function resolvePrivyTransferAsset(
  network: string,
  tokenAddress: string | null | undefined,
): string | null {
  if (network !== "base-mainnet" || tokenAddress == null) {
    return null;
  }
  return (
    BASE_GAS_PAYMENT_TOKEN_ADDRESSES[tokenAddress.trim().toLowerCase()] ?? null
  );
}

export function resolvePrivyTransferChain(network: string): string | null {
  return PRIVY_CHAIN_BY_NETWORK[network] ?? null;
}

export function shouldUsePrivyTransfer(
  network: string,
  tokenAddress: string | null | undefined,
): boolean {
  return (
    resolvePrivyTransferChain(network) != null &&
    resolvePrivyTransferAsset(network, tokenAddress) != null
  );
}
