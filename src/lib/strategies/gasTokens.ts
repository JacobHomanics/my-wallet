import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';

/**
 * Base mainnet tokens Privy can debit for gas when sending the same token.
 * They do not pay gas for other assets on the network.
 */
export const BASE_GAS_PAYMENT_TOKEN_ADDRESSES: ReadonlySet<string> = new Set([
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
  '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42', // EURC
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2', // USDT
]);

/**
 * Per-leg gas headroom when Privy debits Base USDC/EURC/USDT for fees (6 decimals).
 * Keep in sync with convex/lib/gasTokens.ts `PRIVY_TRANSFER_GAS_RESERVE_RAW`.
 */
export const BASE_PRIVY_TRANSFER_GAS_RESERVE_RAW = 10_000n;

/** USD equivalent of `BASE_PRIVY_TRANSFER_GAS_RESERVE_RAW` for priced stables. */
export const BASE_PRIVY_TRANSFER_GAS_FEE_USD =
  Number(BASE_PRIVY_TRANSFER_GAS_RESERVE_RAW) / 1_000_000;

export function isBaseGasPaymentToken(token: OwnedToken): boolean {
  if (token.network !== 'base-mainnet' || token.tokenAddress == null) {
    return false;
  }
  return BASE_GAS_PAYMENT_TOKEN_ADDRESSES.has(
    token.tokenAddress.trim().toLowerCase(),
  );
}

export function isBaseGasPaymentAddress(
  network: string,
  tokenAddress: string | null | undefined,
): boolean {
  if (network !== 'base-mainnet' || tokenAddress == null) {
    return false;
  }
  return BASE_GAS_PAYMENT_TOKEN_ADDRESSES.has(
    tokenAddress.trim().toLowerCase(),
  );
}

/** Native chain gas tokens (ETH, SOL, POL, etc.) — deprioritized for payment allocation. */
export function isGasToken(token: OwnedToken): boolean {
  return isNativeTokenAddress(token.tokenAddress);
}

/** True when Privy can pay this transfer's gas from the token being sent. */
export function canPayOwnTransferGas(
  network: string,
  tokenAddress: string | null | undefined,
): boolean {
  return (
    isNativeTokenAddress(tokenAddress) ||
    isBaseGasPaymentAddress(network, tokenAddress)
  );
}

/** Tokens whose balances may have a fee reserve deducted before spendable use. */
export function hasGasReserve(token: OwnedToken): boolean {
  return isGasToken(token) || isBaseGasPaymentToken(token);
}

/**
 * Native gas legs broadcast last so fee headroom remains for earlier legs
 * on the same network.
 */
export function shouldDeferLegForGasPayment(token: OwnedToken): boolean {
  return isGasToken(token);
}
