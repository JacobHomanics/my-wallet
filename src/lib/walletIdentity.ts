import { PublicKey } from '@solana/web3.js';

import type { UserWallet } from '@/hooks/useUserWallets.shared';

/** Payload: version(1) + evm(20) + solana(32). */
const VERSION = 1;
const EVM_LEN = 20;
const SOLANA_LEN = 32;
const PAYLOAD_LEN = 1 + EVM_LEN + SOLANA_LEN;

export type WalletIdentityAddresses = {
  evmAddress: string;
  solanaAddress: string;
};

function evmAddressToBytes(address: string): Uint8Array {
  const hex = address.startsWith('0x') ? address.slice(2) : address;
  if (!/^[0-9a-fA-F]{40}$/.test(hex)) {
    throw new Error('Invalid EVM address');
  }
  const bytes = new Uint8Array(EVM_LEN);
  for (let i = 0; i < EVM_LEN; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToEvmAddress(bytes: Uint8Array): string {
  let hex = '0x';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex;
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return new Uint8Array(
    Buffer.from(padded + '='.repeat(padLen), 'base64'),
  );
}

/**
 * Pack EVM + Solana addresses into a single reversible base64url id.
 * Format: version(1) ‖ evm(20) ‖ solana(32).
 */
export function encodeWalletIdentity(
  evmAddress: string,
  solanaAddress: string,
): string {
  const evm = evmAddressToBytes(evmAddress);
  const solana = new PublicKey(solanaAddress).toBytes();
  if (solana.length !== SOLANA_LEN) {
    throw new Error('Invalid Solana address');
  }

  const payload = new Uint8Array(PAYLOAD_LEN);
  payload[0] = VERSION;
  payload.set(evm, 1);
  payload.set(solana, 1 + EVM_LEN);
  return toBase64Url(payload);
}

/** Decode a wallet identity id back to its EVM + Solana addresses. */
export function decodeWalletIdentity(identityId: string): WalletIdentityAddresses {
  const payload = fromBase64Url(identityId);
  if (payload.length !== PAYLOAD_LEN) {
    throw new Error('Invalid wallet identity length');
  }
  if (payload[0] !== VERSION) {
    throw new Error(`Unsupported wallet identity version: ${payload[0]}`);
  }

  const evmAddress = bytesToEvmAddress(payload.subarray(1, 1 + EVM_LEN));
  const solanaAddress = new PublicKey(
    payload.subarray(1 + EVM_LEN, PAYLOAD_LEN),
  ).toBase58();

  return { evmAddress, solanaAddress };
}

/** Decode when possible; returns null for empty or malformed ids. */
export function tryDecodeWalletIdentity(
  identityId: string | undefined | null,
): WalletIdentityAddresses | null {
  const trimmed = identityId?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return decodeWalletIdentity(trimmed);
  } catch {
    return null;
  }
}

/**
 * Build a reversible identity id from the user's wallet list.
 * Requires both an ethereum and a solana address.
 */
export function computeWalletIdentityId(
  wallets: readonly UserWallet[],
): string | null {
  const evm = wallets.find((w) => w.chain === 'ethereum')?.address;
  const solana = wallets.find((w) => w.chain === 'solana')?.address;
  if (!evm || !solana) {
    return null;
  }

  try {
    return encodeWalletIdentity(evm, solana);
  } catch {
    return null;
  }
}
