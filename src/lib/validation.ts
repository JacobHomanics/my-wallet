export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/** EIP-55 checksum not required — accepts any 0x-prefixed 20-byte hex address. */
export function isValidEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

/**
 * Solana addresses are base58-encoded 32-byte pubkeys (typically 32–44 chars).
 * Rejects characters that are not in the Bitcoin/Solana base58 alphabet.
 */
export function isValidSolanaAddress(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 32 || trimmed.length > 44) {
    return false;
  }
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed);
}

export function isValidRecipientAddress(
  value: string,
  chain: 'ethereum' | 'solana',
): boolean {
  return chain === 'solana'
    ? isValidSolanaAddress(value)
    : isValidEvmAddress(value);
}

/** ENS name (e.g. vitalik.eth). Normalizes to lowercase. */
export function normalizeEnsName(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Basic ENS name shape check before hitting the resolver.
 * Supports standard `.eth` names and common subdomains.
 */
export function isValidEnsName(value: string): boolean {
  const normalized = normalizeEnsName(value);
  if (!normalized.includes('.')) {
    return false;
  }
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
    normalized,
  );
}

/** Lowercase trimmed username for storage / comparison. */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Empty (clears username) or 3–24 chars of a-z, 0-9, underscore.
 */
export function isValidUsername(value: string): boolean {
  const normalized = normalizeUsername(value);
  if (normalized.length === 0) {
    return true;
  }
  return /^[a-z0-9_]{3,24}$/.test(normalized);
}
