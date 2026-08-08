/**
 * ERC-20 `transfer(address,uint256)` calldata.
 * Selector = first 4 bytes of keccak256("transfer(address,uint256)").
 */
const TRANSFER_SELECTOR = "a9059cbb";

function strip0x(value: string): string {
  return value.startsWith("0x") || value.startsWith("0X")
    ? value.slice(2)
    : value;
}

function padLeft(hex: string, bytes: number): string {
  const normalized = strip0x(hex).toLowerCase();
  const width = bytes * 2;
  if (normalized.length > width) {
    throw new Error("Hex value too large for ABI encoding");
  }
  return normalized.padStart(width, "0");
}

export function encodeErc20Transfer(
  recipient: string,
  amount: bigint,
): `0x${string}` {
  const to = padLeft(recipient, 32);
  const value = padLeft(amount.toString(16), 32);
  return `0x${TRANSFER_SELECTOR}${to}${value}`;
}
