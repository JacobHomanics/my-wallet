type KeystoreJson = {
  address?: string;
};

function normalizeEvmAddress(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function readKeystoreAddress(filename: "treasury" | "cashback"): string | null {
  try {
    const keystore =
      filename === "treasury"
        ? (require("../keystores/treasury.json") as KeystoreJson)
        : (require("../keystores/cashback.json") as KeystoreJson);
    if (!keystore.address) {
      return null;
    }
    return normalizeEvmAddress(keystore.address);
  } catch {
    return null;
  }
}

export function getTreasuryKeystoreAddress(): string | null {
  return readKeystoreAddress("treasury");
}

export function getCashbackKeystoreAddress(): string | null {
  return readKeystoreAddress("cashback");
}
