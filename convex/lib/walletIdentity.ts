const VERSION = 1;
const EVM_LEN = 20;
const SOLANA_LEN = 32;
const PAYLOAD_LEN = 1 + EVM_LEN + SOLANA_LEN;

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToEvmAddress(bytes: Uint8Array): string {
  let hex = "0x";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

/** Decode an EVM address from a wallet identity id when possible. */
export function tryDecodeEvmAddressFromIdentityId(
  identityId: string | undefined | null,
): string | null {
  const trimmed = identityId?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const payload = fromBase64Url(trimmed);
    if (payload.length !== PAYLOAD_LEN || payload[0] !== VERSION) {
      return null;
    }

    return bytesToEvmAddress(payload.subarray(1, 1 + EVM_LEN));
  } catch {
    return null;
  }
}

export function normalizeEvmAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** Whether an identity id encodes the given EVM address. */
export function identityIdMatchesEvmAddress(
  identityId: string | undefined | null,
  ethereumAddress: string,
): boolean {
  const decoded = tryDecodeEvmAddressFromIdentityId(identityId);
  if (!decoded) {
    return false;
  }

  return (
    normalizeEvmAddress(decoded) === normalizeEvmAddress(ethereumAddress)
  );
}
